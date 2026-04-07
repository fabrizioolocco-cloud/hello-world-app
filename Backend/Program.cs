using System.Text;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var tvIp = builder.Configuration["TvIp"] ?? "192.168.1.128";
var authState = new TvAuthState
{
    Cookie = builder.Configuration["TvAuthCookie"] ?? "EA3DE9B05A5D7D667B72BF24CC184DCAABC95D16",
    LastRenewed = DateTime.UtcNow
};

var app = builder.Build();
app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

// Send IRCC command to TV
async Task<IResult> SendIrcc(string code)
{
    using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
    var body = $"""
        <?xml version="1.0"?>
        <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
        <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
        <IRCCCode>{code}</IRCCCode>
        </u:X_SendIRCC>
        </s:Body>
        </s:Envelope>
        """;

    var request = new HttpRequestMessage(HttpMethod.Post, $"http://{tvIp}/sony/IRCC");
    request.Content = new StringContent(body, Encoding.UTF8, "text/xml");
    request.Headers.Add("Cookie", $"auth={authState.Cookie}");

    try
    {
        var response = await client.SendAsync(request);
        if ((int)response.StatusCode == 401 || (int)response.StatusCode == 403)
        {
            authState.Cookie = "";
            return Results.Json(new { success = false, error = "Auth scaduta" }, statusCode: 401);
        }
        return response.IsSuccessStatusCode
            ? Results.Ok(new { success = true })
            : Results.Json(new { success = false, error = $"TV error: {response.StatusCode}" }, statusCode: 502);
    }
    catch
    {
        return Results.Json(new { success = false, error = "TV non raggiungibile" }, statusCode: 503);
    }
}

// Generic command endpoint
app.MapPost("/api/tv/command", async (CommandRequest cmd) => await SendIrcc(cmd.Code));

// Power toggle (uses JSON-RPC)
app.MapPost("/api/tv/power", async () =>
{
    using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };

    var statusRequest = new HttpRequestMessage(HttpMethod.Post, $"http://{tvIp}/sony/system");
    statusRequest.Content = new StringContent(
        """{"method":"getPowerStatus","params":[],"id":1,"version":"1.0"}""",
        Encoding.UTF8, "application/json");
    statusRequest.Headers.Add("Cookie", $"auth={authState.Cookie}");

    try
    {
        var statusResponse = await client.SendAsync(statusRequest);
        var statusJson = await statusResponse.Content.ReadAsStringAsync();

        if (statusJson.Contains("Unauthorized") || statusJson.Contains("401"))
        {
            authState.Cookie = "";
            return Results.Json(new { success = false, error = "Auth scaduta" }, statusCode: 401);
        }

        bool isOn = statusJson.Contains("\"active\"");

        var powerRequest = new HttpRequestMessage(HttpMethod.Post, $"http://{tvIp}/sony/system");
        powerRequest.Content = new StringContent(
            $"{{\"method\":\"setPowerStatus\",\"params\":[{{\"status\":{(!isOn ? "true" : "false")}}}],\"id\":1,\"version\":\"1.0\"}}",
            Encoding.UTF8, "application/json");
        powerRequest.Headers.Add("Cookie", $"auth={authState.Cookie}");

        var powerResponse = await client.SendAsync(powerRequest);
        return powerResponse.IsSuccessStatusCode
            ? Results.Ok(new { success = true })
            : Results.Json(new { success = false, error = $"TV error: {powerResponse.StatusCode}" }, statusCode: 502);
    }
    catch
    {
        return Results.Json(new { success = false, error = "TV non raggiungibile" }, statusCode: 503);
    }
});

// Trigger PIN display
app.MapPost("/api/tv/pin", async () =>
{
    using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    var request = new HttpRequestMessage(HttpMethod.Post, $"http://{tvIp}/sony/accessControl");
    request.Content = new StringContent(
        """{"method":"actRegister","params":[{"clientid":"HelloWorldApp","nickname":"HelloWorldApp","level":"private"},[{"value":"yes","function":"WOL"}]],"id":1,"version":"1.0"}""",
        Encoding.UTF8, "application/json");
    try
    {
        await client.SendAsync(request);
        return Results.Ok(new { success = true });
    }
    catch
    {
        return Results.Json(new { success = false, error = "TV non raggiungibile" }, statusCode: 503);
    }
});

// Register with PIN
app.MapPost("/api/tv/register", async (string pin) =>
{
    using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    var request = new HttpRequestMessage(HttpMethod.Post, $"http://{tvIp}/sony/accessControl");
    request.Content = new StringContent(
        """{"method":"actRegister","params":[{"clientid":"HelloWorldApp","nickname":"HelloWorldApp","level":"private"},[{"value":"yes","function":"WOL"}]],"id":1,"version":"1.0"}""",
        Encoding.UTF8, "application/json");
    request.Headers.Add("Authorization", "Basic " + Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pin}")));

    try
    {
        var response = await client.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            if (response.Headers.TryGetValues("Set-Cookie", out var cookies))
            {
                var authCookie = cookies.FirstOrDefault(c => c.StartsWith("auth="))?.Split(';')[0]?.Replace("auth=", "");
                if (!string.IsNullOrEmpty(authCookie))
                {
                    authState.Cookie = authCookie;
                    authState.LastRenewed = DateTime.UtcNow;
                    return Results.Ok(new { success = true });
                }
            }
            return Results.Ok(new { success = true });
        }
        return Results.Json(new { success = false, error = "PIN non valido" }, statusCode: 401);
    }
    catch
    {
        return Results.Json(new { success = false, error = "TV non raggiungibile" }, statusCode: 503);
    }
});

app.MapFallbackToFile("index.html");
app.Run();

class TvAuthState
{
    public string Cookie { get; set; } = "";
    public DateTime LastRenewed { get; set; } = DateTime.MinValue;
}

record CommandRequest(string Code);
