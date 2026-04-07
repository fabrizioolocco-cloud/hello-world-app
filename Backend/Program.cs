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

var app = builder.Build();

app.UseCors();

// Serve React static files from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/hello", () =>
{
    return Results.Ok(new { message = "Hello World!" });
});

// Fallback to index.html for SPA routing
app.MapFallbackToFile("index.html");

app.Run();
