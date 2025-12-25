# Cấu Hình API Gateway

## Giới Thiệu

File này mô tả cấu hình API Gateway cho hệ thống FEPA Microservices.

## Biến Môi Trường

Xem file `.env.example` để biết tất cả các biến cần thiết.

### Các biến chính

```bash
# Server
PORT=3000                          # Cổng API Gateway
NODE_ENV=development               # Môi trường (development/production)

# Services TCP
AUTH_SERVICE_HOST=localhost        # Host của Auth Service
AUTH_SERVICE_PORT=3001             # Port của Auth Service (TCP)
EXPENSE_SERVICE_HOST=localhost     # Host của Expense Service
EXPENSE_SERVICE_PORT=3002          # Port của Expense Service (TCP)
# ... các services khác

# Security
JWT_SECRET=your-secret-key         # Secret key cho JWT
JWT_EXPIRATION=24h                 # Thời gian hết hạn token

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000         # Cửa sổ rate limiting (ms)
RATE_LIMIT_MAX_REQUESTS=100        # Số request tối đa trong cửa sổ

# Logging
LOG_LEVEL=debug                    # Mức logging (debug/info/warn/error)
```

## Cơ Chế Hoạt Động

### 1. Kết Nối TCP với Microservices

API Gateway sử dụng NestJS `@nestjs/microservices` với TCP Transport để gọi các microservices:

```typescript
// app.module.ts
ClientsModule.registerAsync([
  {
    name: 'AUTH_SERVICE',
    useFactory: (configService: ConfigService) => ({
      transport: Transport.TCP,
      options: configService.get('services.auth'),
    }),
    inject: [ConfigService],
  },
  // ... các services khác
]);
```

### 2. Message Patterns

Mỗi call từ gateway đến service sử dụng message pattern:

```typescript
// Từ gateway
this.authClient.send({ cmd: 'auth.login' }, loginData)

// Service nhận bằng @MessagePattern
@MessagePattern({ cmd: 'auth.login' })
async login(data: LoginDto) { ... }
```

### 3. Global Pipes, Filters, Interceptors

- **ValidationPipe**: Validate request DTO tự động
- **LoggingInterceptor**: Log tất cả HTTP requests/responses
- **TransformInterceptor**: Wrap response vào format chuẩn
- **AllExceptionsFilter**: Handle tất cả exceptions

## Kết Cấu Thư Mục

```
api-gateway/
├── src/
│   ├── config/
│   │   ├── configuration.module.ts   # ConfigModule setup
│   │   └── gateway.config.ts         # Config factory
│   ├── common/
│   │   ├── decorators/
│   │   │   └── public.decorator.ts   # Public endpoint decorator
│   │   ├── dto/
│   │   │   └── index.ts              # DTO definitions
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── interceptors/
│   │       ├── logging.interceptor.ts
│   │       └── transform.interceptor.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.module.ts
│   │   ├── expense/
│   │   ├── budget/
│   │   ├── blog/
│   │   ├── subscription/
│   │   ├── notification/
│   │   ├── ocr/
│   │   └── ai/
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── .env                # Biến môi trường (development)
├── .env.example        # Template biến môi trường
└── package.json
```

## Chạy ứng dụng

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Swagger docs
http://localhost:3000/docs

# Health check
http://localhost:3000/api/v1/health
```

## Endpoints Có Sẵn

### Health Check

```
GET /api/v1/health
```

Response:

```json
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2025-12-11T10:00:00Z",
  "environment": "development"
}
```

### Swagger Documentation

```
GET /docs
```

## Mở Rộng

Để thêm service mới:

1. Thêm config trong `.env`:

   ```
   NEW_SERVICE_HOST=localhost
   NEW_SERVICE_PORT=3009
   ```

2. Thêm vào `gateway.config.ts`:

   ```typescript
   newService: {
     host: process.env.NEW_SERVICE_HOST || 'localhost',
     port: parseInt(process.env.NEW_SERVICE_PORT ?? '3009', 10),
   }
   ```

3. Thêm ClientModule vào `app.module.ts`

4. Tạo controller mới trong `src/modules/new-service/`

## Tham Khảo

- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [NestJS TCP Transport](https://docs.nestjs.com/microservices/tcp)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
