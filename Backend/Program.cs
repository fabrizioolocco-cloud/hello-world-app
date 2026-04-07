var builder = WebApplication.CreateBuilder(args);

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
