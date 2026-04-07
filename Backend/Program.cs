using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Render provides PORT env variable - use it
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Sony TV config
var tvIp = builder.Configuration["TvIp"] ?? "192.168.1.128";
var tvPsk = builder.Configuration["TvPsk"] ?? "";

var app = builder.Build();

app.UseCors();

// Serve React static files from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/hello", () =>
{
    return Results.Ok(new { message = "Hello World!" });
});

// Sony TV - Power Toggle
app.MapPost("/api/tv/power", async (HttpContext context) =>
{
    using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };

    var url = $"http://{tvIp}/sony/IRCC";
    var irccCode = "AAAAAQAAAAEAAAAVAw==";

    var body = $"""
        <?xml version="1.0"?>
        <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
          <s:Body>
            <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
              <IRCCCode>{irccCode}</IRCCCode>
            </u:X_SendIRCC>
          </s:Body>
        </s:Envelope>
        """;

    var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Content = new StringContent(body, Encoding.UTF8, "text/xml");
    request.Headers.Add("SOAPAction", "urn:schemas-sony-com:service:IRCC:1#X_SendIRCC");

    if (!string.IsNullOrEmpty(tvPsk))
        request.Headers.Add("X-Auth-PSK", tvPsk);

    try
    {
        var response = await client.SendAsync(request);
        return response.IsSuccessStatusCode
            ? Results.Ok(new { success = true })
            : Results.Json(new { success = false, error = $"TV error: {response.StatusCode}" }, statusCode: 502);
    }
    catch (HttpRequestException ex)
    {
        return Results.Json(new { success = false, error = "TV non raggiungibile. Controlla che sia acceso e sulla stessa rete." }, statusCode: 503);
    }
});

// Fallback to index.html for SPA routing
app.MapFallbackToFile("index.html");

app.Run();
