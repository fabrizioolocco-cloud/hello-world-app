# Step 1: Build React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN VITE_BUILD_OUTDIR=./dist npm run build

# Step 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /src
COPY Backend/Backend.csproj ./
RUN dotnet restore
COPY Backend/ ./
RUN mkdir -p wwwroot
COPY --from=frontend-build /frontend/dist ./wwwroot
RUN dotnet publish -c Release -o /app/publish

# Step 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=backend-build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Backend.dll"]
