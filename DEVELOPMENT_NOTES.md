# Hướng Dẫn Xây Dựng Backend CuongHoangDev V2 — Từ Con Số 0

> Ghi chú chi tiết toàn bộ kiến thức từ Ngày 1 đến Ngày 14.
> Đọc từ từ, hiểu từng phần, tự làm lại từ đầu để thực sự nắm vững.

---

## MỤC LỤC

- [Ngày 1 — Setup Spring Boot + PostgreSQL + Health Check](#ngày-1--setup-spring-boot--postgresql--health-check)
- [Ngày 2 — Flyway Migration](#ngày-2--flyway-migration)
- [Ngày 3 — Repository + Service + Exception Handler](#ngày-3--repository--service--exception-handler)
- [Ngày 4 — Spring Security + JWT](#ngày-4--spring-security--jwt)
- [Ngày 5 — Auth REST API (Login + Register)](#ngày-5--auth-rest-api-login--register)
- [Ngày 8 — CRUD Nâng Cao (Admin Quản Lý User)](#ngày-8--crud-nâng-cao-admin-quản-lý-user)
- [Ngày 9 — Phân Trang & Tìm Kiếm](#ngày-9--phân-trang--tìm-kiếm)
- [Ngày 10 — Upload File + Storage](#ngày-10--upload-file--storage)
- [Ngày 11 — Redis Cache + Blog System](#ngày-11--redis-cache--blog-system)
- [Ngày 12 — pgvector + Spring AI (RAG Chatbot)](#ngày-12--pgvector--spring-ai-vector-database)
- [Ngày 13 — Tự động nạp tri thức (Knowledge Ingestion)](#ngày-13--tự-động-nạp-tri-thức-knowledge-ingestion)
- [Ngày 14 — Hoàn thiện RAG API (Streaming + Feedback)](#ngày-14--hoàn-thiện-rag-api-streaming--feedback)

---

## NGÀY 1 — Setup Spring Boot + PostgreSQL + Health Check

### 1.1. Kiến thức cần học TRƯỚC KHI LÀM

#### a) Spring Boot là gì?
Spring Boot là một framework xây dựng trên nền Spring, giúp tạo ứng dụng Java nhanh chóng. No tu dong cau hinh, khong can XML, chi can mot file `application.yml` hoac `application.properties`.

```java
@SpringBootApplication
public class ApiBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiBackendApplication.class, args);
    }
}
```

`@SpringBootApplication` la shorthand cho 3 annotation:
- `@Configuration` — class nay la ngu canh cau hinh
- `@EnableAutoConfiguration` — tu dong cau hinh Spring
- `@ComponentScan` — tu dong quet cac component trong package

#### b) pom.xml — Maven Dependency Management

`pom.xml` (Project Object Model) khai bao tat ca thu vien can su dung.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <!-- Ke thua cau hinh tu Spring Boot Parent -->
        <!-- Giup tu dong phien ban cua tat ca dependency -->
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.6</version>
    </parent>
    <groupId>com.cuonghoangdev</groupId>
    <artifactId>api-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starter Web (Tomcat + MVC) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
        <!-- Spring Data JPA (Hibernate + JPA) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <!-- PostgreSQL Driver -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope> <!-- Chi can luc chay, khong can luc compile -->
        </dependency>
    </dependencies>
</project>
```

**Quy tac doc pom.xml:**
- `<parent>` — ke thua Spring Boot Parent, cac phien ban (version) duoc quan ly o mot cho
- `<groupId>` — ten nhom/to chuc (dat theo domain nguoc)
- `<artifactId>` — ten du an
- `<version>` — phien ban
- `<dependency>` — thu vien can su dung
- `<scope>runtime</scope>` — chi can luc chay, khong can luc compile

#### c) PostgreSQL

PostgreSQL la mot database (CSDL) quan he. Thuc hanh:

```bash
# Kiem tra PostgreSQL da chay chua
pg_isready -h localhost -p 5432

# Tao database moi
createdb -h localhost -p 5432 -U postgres ten_database

# Ket noi vao database
psql -h localhost -p 5432 -U postgres -d ten_database

# Tao database bang lenh SQL
CREATE DATABASE cuonghoangdev_db;
```

#### d) application.yml

Thay vi `application.properties`, dung `application.yml` de cau hinh — de doc hon.

```yaml
spring:
  application:
    name: api-backend          # Ten ung dung

  datasource:                   # Cau hinh ket noi database
    url: jdbc:postgresql://localhost:5432/cuonghoangdev_db
    username: postgres          # Tai khoan database
    password: 123456            # Mat khau
    driver-class-name: org.postgresql.Driver  # Driver ket noi

  jpa:                          # Cau hinh Hibernate/JPA
    hibernate:
      ddl-auto: none            # Khong tu tao bang (dung Flyway)
    show-sql: true              # Hien thi SQL ra console (tuc thoi khi dev)

server:
  port: 8080                    # Ung dung chay tren port nao
```

**Diem quan trong:**
- `jpa.hibernate.ddl-auto: none` — Hibernate chi doc schema, khong tao bang. Vi ta dung Flyway de quan ly schema.
- `spring.datasource` — cau hinh ket noi PostgreSQL qua JDBC

#### e) REST API — Controller

```java
@RestController                        // = @Controller + @ResponseBody
@RequestMapping("/api/v1/system")      // Duong dan goc cho tat ca method
public class HealthCheckController {

    @GetMapping("/health")              // Xu ly GET /api/v1/system/health
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("He thong hoat dong tot!");
    }
}
```

**Diem quan trong:**
- `@RestController` tra ve JSON (hoac text) truc tiep, khong can view engine
- `@GetMapping` lai annotation GET HTTP
- `ResponseEntity<T>` giup tuy chinh HTTP status code + header + body
- `@RequestMapping` la annotation goc, co the dung cho nhieu HTTP method

### 1.2. Cach lam (tuyen tinh)

1. Tao project bang Spring Initializr hoac tao tay
2. Viet `pom.xml` voi cac dependency can thiet
3. Tao `ApiBackendApplication.java` (file main)
4. Tao `application.yml` cau hinh database
5. Tao `HealthCheckController.java`
6. Chay `./mvnw spring-boot:run` de test

### 1.3. Lenh chay

```bash
# Khoi tao database
createdb -h localhost -p 5432 -U postgres cuonghoangdev_db

# Chay ung dung
./mvnw spring-boot:run

# Test
curl http://localhost:8080/api/v1/system/health
```

### 1.4. Cac loi thuong gap

| Loi | Nguyen nhan | Cach fix |
|---|---|---|
| `Connection refused` | PostgreSQL chua chay | `brew services start postgresql` |
| `Unknown database` | Database chua ton tai | Tao bang `createdb` |
| `Table does not exist` | JPA cau hinh sai | Dat `ddl-auto: none`, dung Flyway |

---

## NGÀY 2 — Flyway Migration

### 2.1. Kiến thức cần học

#### a) Flyway la gi?

Flyway la cong cu quan ly schema database (migration). Thay vi tao bang bang tay, ta viet script SQL, Flyway chay script do khi ung dung khoi dong.

**Tai sao can Flyway:**
- Quan ly version cua schema (V1, V2, V3...)
- Chay migration tu dong khi start
- Ho tro rollback, repair
- Lam viec nhom de dang hon (moi nguoi cung script SQL)

#### b) Spring Boot + Flyway Auto-Configuration

Spring Boot 4 co modular design — phai dung `spring-boot-starter-flyway` (khong phai `flyway-core`).

```xml
<!-- Sai — flyway-core chi thu vien, khong auto-config -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>

<!-- Dung — starter bao gom auto-configuration -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-flyway</artifactId>
</dependency>

<!-- Can them driver database -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

#### c) Quy uoc dat ten file Flyway

```
db/migration/
  V1__Init_users_and_roles.sql
  V2__Add_profile_table.sql
  V3__Alter_users_add_avatar.sql
```

**Quy tac dat ten:**
- `V` + so thu tu + `__` (2 dau gach duoi) + mo ta
- Dung `__` (2 dau gach duoi) de tach version va mo ta
- So thu tu tang dan, khong can gap nhau

#### d) Cu phap SQL Migration

```sql
-- V1__Init_users_and_roles.sql

-- Tao bang roles
CREATE TABLE roles (
    id   BIGSERIAL PRIMARY KEY,     -- Tu tang, kieu long
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Tao bang users
CREATE TABLE users (
    id                      BIGSERIAL PRIMARY KEY,
    username                VARCHAR(50)  NOT NULL UNIQUE,
    password                VARCHAR(255) NOT NULL,
    email                   VARCHAR(100) NOT NULL UNIQUE,
    full_name               VARCHAR(100),
    enabled                 BOOLEAN DEFAULT TRUE,
    account_non_expired     BOOLEAN DEFAULT TRUE,
    account_non_locked      BOOLEAN DEFAULT TRUE,
    credentials_non_expired BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tao bang trung gian nhieu-nhieu
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Chen du lieu mac dinh
INSERT INTO roles (name) VALUES
    ('ROLE_ADMIN'),
    ('ROLE_USER');
```

#### e) Cau hinh Flyway trong application.yml

```yaml
spring:
  flyway:
    enabled: true                    # Bat Flyway
    locations: classpath:db/migration  # Thu muc chua script
    baseline-on-migrate: true         # Neu DB co du lieu cu, tao baseline
    validate-on-migrate: true        # Kiem tra truoc khi chay
```

### 2.2. Lenh huu ich

```bash
# Reset toan bo migration (XOA DU LIEU!)
./mvnw flyway:clean
./mvnw flyway:migrate

# Chi chay lai migration cuoi cung
./mvnw flyway:repair && ./mvnw flyway:migrate

# Xem trang thai migration
./mvnw flyway:info
```

### 2.3. Cach hoat dong thuc su

Khi ung dung chay:
1. Flyway kiem tra bang `flyway_schema_history` trong DB
2. Doc tat ca file trong `db/migration/`
3. So sanh version da chay vs chua chay
4. Chay nhung script chua duoc apply
5. Ghi lai trang thai vao `flyway_schema_history`

### 2.4. Loi thuong gap

| Loi | Nguyen nhan | Cach fix |
|---|---|---|
| `Schema history table not found` | Chua co bang Flyway | Flyway tu tao, chi can DB rong |
| `Checksum mismatch` | File SQL bi sua | Chay `flyway:repair` |
| `Migration checksum mismatch` | Script da duoc apply nhung bi doi noi dung | Reset DB hoac `flyway:repair` |

---

## NGÀY 3 — Repository + Service + Exception Handler

### 3.1. Kien thuc tong quan Layer Architecture

Backend co 3 lop chinh:

```
Controller → Service → Repository → Database
   (API)     (Logic)   (Data)      (SQL)
```

- **Controller** — tiep nhan request, goi Service, tra ve response
- **Service** — xu ly logic nghiep vu
- **Repository** — tuong tac voi database (JPA)

### 3.2. JPA Repository

#### a) Entity — Ánh xạ bảng sang Java

```java
@Entity                          // Danh dau day la entity JPA
@Table(name = "users")            // Ten bang trong database
@EntityListeners(AuditingEntityListener.class)  // Nghe su kien de tu dong fill timestamp
public class User {

    @Id                          // Khoa chinh
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // Tu tang (auto-increment)
    private Long id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;      // nullable: khong null, unique: khong trung

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    // Moi-nhieu: User co nhieu Role
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    // JPA Auditing — tu dong fill thoi gian
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Getter & Setter (bo qua neu dung Lombok)
}
```

#### b) JPA Auditing — Tu dong thoi gian

```java
@Configuration
@EnableJpaAuditing  // Bat tính nang auditing
public class JpaConfig {
}
```

Bat `auditing` de JPA tu dong fill `createdAt`/`updatedAt` khi `save()`.

#### c) Repository — Giao dien truy cap du lieu

```java
@Repository                        // Danh dau la Repository (optional, @Entity da ngam)
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data tu dong implement these methods
    Optional<User> findByUsername(String username);           // SELECT WHERE username = ?
    boolean existsByUsername(String username);               // SELECT EXISTS(...)
    boolean existsByEmail(String email);
}
```

**Quy tac dat ten method Spring Data:**
```
findBy + TenField           → Tim 1 ban ghi
findAllBy + TenField        → Tim nhieu ban ghi
existsBy + TenField         → Kiem tra ton tai
findByTenFieldAndAnotherField → WHERE ... AND ...
findByTenFieldOrAnotherField  → WHERE ... OR ...
```

### 3.3. Service Layer

```java
@Service  // Danh dau la Service, Spring tu dong tao bean
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;  // Ma hoa BCrypt

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional  // Dam bao tinh toan ven (rollback neu loi)
    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }
}
```

**Diem quan trong:**
- `@Transactional` dam bao nhieu thao tac DB la mot don vi (unit of work). Neu 1 thao tac loi, tat ca rollback.
- `save()` cua JPA Repository tu dong phan biet insert vs update (dua vao `id` co null hay khong)

### 3.4. API Response Wrapper — ApiResponse

Tat ca API tra ve cung mot format JSON:

```json
{
    "success": true,
    "message": "Thành công",
    "data": { ... },
    "timestamp": "2026-05-27T19:00:00"
}
```

```java
@JsonInclude(JsonInclude.Include.NON_NULL)  // An field null khoi JSON
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "Thành công", data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
```

**Tai sao can wrapper:**
- Tra ve code nhung thong diep nhat quan
- Fe client deu biet thanh cong hay that bai
- Thong nhat format cho toan he thong

### 3.5. Exception Handler — Xu ly loi tap trung

```java
@RestControllerAdvice  // Xu ly exception cho TAT CA Controller
public class GlobalExceptionHandler {

    // Loi khong tim thay resource (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return new ResponseEntity<>(
            ApiResponse.error(ex.getMessage()),
            HttpStatus.NOT_FOUND
        );
    }

    // Loi validation (400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            errors.put(fieldName, error.getDefaultMessage());
        });
        return new ResponseEntity<>(
            ApiResponse.error("Dữ liệu không hợp lệ", errors),
            HttpStatus.BAD_REQUEST
        );
    }

    // Loi chung (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        return new ResponseEntity<>(
            ApiResponse.error("Lỗi hệ thống: " + ex.getMessage()),
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
```

**Diem quan trong:**
- `@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`
- Moi `@ExceptionHandler` xu ly mot loai exception cu the
- Tra `ApiResponse` de format nhat quan

### 3.6. Circular Reference — @JsonIgnore

Khi `User` co `Set<Role>`, va `Role` lai co `Set<User>`, Jackson se lap vo tan khi convert sang JSON.

```java
// Trong Role.java — an field users de tranh lap vo han
@JsonIgnore
@ManyToMany(mappedBy = "roles")
private Set<User> users;
```

### 3.7. Lombok (ghi chu them)

Neu ban muon code ngan hon, co the dung Lombok thay vi viet Getter/Setter tay:

```java
@Entity
@Getter @Setter  // Tu dong tao getter/setter
@NoArgsConstructor @AllArgsConstructor  // Constructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
}
```

Hien tai du an khong dung Lombok de ban hieu ro cac thanh phan.

---

## NGÀY 4 — Spring Security + JWT

### 4.1. Kien thuc tong quan Bao mat

#### a) Stateless vs Stateful Authentication

| | Stateless | Stateful |
|---|---|---|
| Token | Luu tren client | Luu tren server (session) |
| Server | Khong luu trang thai | Luu session ID |
| Scalability | De mo rong (nhieu server) | Can sticky session |
| Performance | Tot hon | Co overhead |

**JWT la stateless** — server khong can luu gi ca, chi can verify signature cua token.

#### b) JWT (JSON Web Token) cau truc

JWT gom 3 phan, cach nhau boi dau `.`:

```
eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImlhdCI6MTc3OTg4NDE2OSwiZXhwIjoxNzc5OTcwNTY5fQ.vYMZOjJFXneuT51PBm9li_1ZNj4Ch0V-YRDctJDzAhlJHhOldDrBUhmxwziuac4Z
```

| Phan | Noi dung | Vi du |
|---|---|---|
| Header | Algorithm + Token type | `{ "alg": "HS384", "typ": "JWT" }` |
| Payload | Data (claims) | `{ "sub": "username", "iat": ..., "exp": ... }` |
| Signature | Chu ky so | HMAC-SHA384(header + payload) |

#### c) Spring Security 6+ thay doi

Spring Security 6/7 (Spring Boot 4) co nhieu thay doi:
- `WebSecurityConfigurerAdapter` da bi xoa — phai cau hinh truc tiep
- `DaoAuthenticationProvider` constructor chi nhan `UserDetailsService` (khong con 2 tham so)
- Session mac dinh la stateless

### 4.2. Dependency

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>    <!-- JJWT library -->
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

### 4.3. JwtTokenProvider — Tao va xac thuc JWT

```java
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    // Tao key ky tu 256 bit (32 bytes) cho HS256
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // Tao token tu username
    public String generateTokenFromUsername(String username) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username)          // Claim "sub" = username
                .issuedAt(now)              // Thoi gian phat hanh
                .expiration(expiry)        // Thoi gian het han
                .signWith(getSigningKey()) // Ky bang HMAC-SHA
                .compact();                 // Dong goi thanh chuoi
    }

    // Lay username tu token
    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // Kiem tra token hop le
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

### 4.4. UserDetails va UserPrincipal

Spring Security can `UserDetails` interface:

```java
// UserPrincipal wraps User entity for Spring Security
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    private final String password;
    private final String email;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.password = user.getPassword();
        this.email = user.getEmail();
        // Chuyen Role entity → GrantedAuthority (Spring Security)
        this.authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
```

### 4.5. CustomUserDetailsService — Load user tu DB

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)  // Chi doc, khong sua
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return new UserPrincipal(user);
    }
}
```

### 4.6. JwtAuthenticationFilter — Loc request

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    // Chay truoc moi request, chi chay 1 lan

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        try {
            String jwt = getJwtFromRequest(request);  // Doc token tu header

            if (jwt != null && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Tao Authentication object — danh dau user da dang nhap
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());

                // Luu vao SecurityContext de cac layer sau truy cap
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication", ex);
        }

        filterChain.doFilter(request, response);  // Tiep tuc filter chain
    }

    // Lay JWT tu header "Authorization: Bearer <token>"
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);  // Bo chu "Bearer "
        }
        return null;
    }
}
```

### 4.7. SecurityConfig — Cau hinh Filter Chain

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired private CustomUserDetailsService userDetailsService;
    @Autowired private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();  // Ma hoa BCrypt
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(...)                                    // CORS config
            .csrf(AbstractHttpConfigurer::disable)        // Tat CSRF (vi dung JWT)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))  // Khong luu session
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/system/**").permitAll()  // Cho phep khong can login
                .requestMatchers("/api/v1/auth/**").permitAll()    // Auth endpoint
                .requestMatchers("/api/v1/roles/**").permitAll()    // Roles public
                .anyRequest().authenticated()                       // Con lai phai login
            )
            .authenticationProvider(authenticationProvider())  // Dung BCrypt
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
            // Chen JWT filter TRUOC UsernamePasswordAuthenticationFilter

        return http.build();
    }
}
```

**Diem quan trong:**
- `.addFilterBefore(filter, class)` — chen filter TRUOC filter duoc chi dinh
- `SessionCreationPolicy.STATELESS` — server khong luu session, moi request deu co token
- `permitAll()` — endpoint khong can dang nhap
- `authenticated()` — endpoint bat buoc phai dang nhap

### 4.8. Cau hinh JWT trong application.yml

```yaml
app:
  jwt:
    secret: ${JWT_SECRET:CuongHoangDevV2SecretKeyNangCao2026NheMaNayCanItNhat256BitNhe}
    expiration-ms: 86400000  # 24 gio

server:
  port: 8080
```

**Luu y:** `secret` nen it nhat 256 bit cho HS256. Neu dung environment variable `JWT_SECRET`, gia tri mac dinh sau `:` duoc su dung.

---

## NGÀY 5 — Auth REST API (Login + Register)

### 5.1. Authentication Manager

`AuthenticationManager` la interface trung tam cua Spring Security, xu ly xac thuc.

```java
@Autowired
private AuthenticationManager authenticationManager;

public AuthResponse login(LoginRequest request) {
    // Tao Authentication object chua username/password
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            request.getUsername(),
            request.getPassword()
        )
    );

    // Neu khong nem exception → xac thuc thanh cong
    SecurityContextHolder.getContext().setAuthentication(authentication);
    String token = tokenProvider.generateToken(authentication);
    // ...
}
```

**Cach hoat dong:**
1. `AuthenticationManager.authenticate()` nhan `UsernamePasswordAuthenticationToken`
2. Goi `DaoAuthenticationProvider` → lay `UserDetailsService` → load user tu DB
3. So sanh password (BCrypt) voi password nhap vao
4. Neu dung → tra ve `Authentication` voi authorities
5. Neu sai → nem `BadCredentialsException`

### 5.2. BCrypt Password Encoding

```java
// Ma hoa password
String hashed = passwordEncoder.encode("myPassword123");
// $2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW

// Kiem tra password
boolean matches = passwordEncoder.matches("myPassword123", hashed);
// true
```

**Tai sao BCrypt:**
- Tu dong tao salt ngau nhien (chong rainbow table)
- Co the cau hinh do manh (cost factor)
- Password cung nhau se co hash khac nhau

### 5.3. DTO (Data Transfer Object)

DTO la object chuyen data giua client va server, khac voi Entity:

```java
// Entity — map voi database
public class User {
    private Long id;
    private String username;
    private String password;  // Mat khau, KHONG tra ve client
    private String email;
    private Set<Role> roles;
    // ...
}

// DTO tra ve client — khong co password
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private Set<String> roles;  // Chi tra ten role, khong tra Role entity
    private LocalDateTime createdAt;

    public static UserDto fromEntity(User user) {
        // Chuyen tu Entity sang DTO
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRoles(user.getRoles().stream()
            .map(r -> r.getName())
            .collect(Collectors.toSet()));
        return dto;
    }
}
```

### 5.4. Validation voi @Valid

```java
public class RegisterRequest {

    @NotBlank(message = "Username khong duoc trong")
    @Size(min = 3, max = 50, message = "Username phai tu 3 den 50 ky tu")
    private String username;

    @NotBlank(message = "Password khong duoc trong")
    @Size(min = 6, max = 100, message = "Password phai tu 6 ky tu tro len")
    private String password;

    @NotBlank(message = "Email khong duoc trong")
    @Email(message = "Email khong hop le")
    private String email;

    private String fullName;
}
```

Su dung trong controller:

```java
@PostMapping("/register")
public ResponseEntity<ApiResponse<UserDto>> register(
        @Valid @RequestBody RegisterRequest request  // @Valid kich hoat validation
) {
    // Neu validation fail → MethodArgumentNotValidException duoc nem
}
```

### 5.5. Auth Service — Logic xu ly

```java
@Service
public class AuthService {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider tokenProvider;

    public AuthResponse login(LoginRequest request) {
        // Xac thuc username/password qua Spring Security
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Tao JWT token
        String token = tokenProvider.generateToken(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return new AuthResponse(token, principal.getId(), principal.getUsername(),
                               principal.getEmail(),
                               principal.getAuthorities().stream().findFirst()
                               .map(a -> a.getAuthority()).orElse("ROLE_USER"));
    }

    @Transactional
    public User register(RegisterRequest request) {
        // Kiem tra trung
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username da ton tai");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email da duoc su dung");
        }

        // Tao user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));  // BCrypt
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setEnabled(true);

        // Gan role mac dinh
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new BadRequestException("Role khong ton tai"));
        user.getRoles().add(userRole);

        return userRepository.save(user);
    }
}
```

### 5.6. CORS (Cross-Origin Resource Sharing)

Neu frontend chay o port khac (VD: localhost:3000), can cau hinh CORS:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
    config.setAllowCredentials(true);  // Cho phep gui cookie/header Authorization

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

**OPTIONS request:** Trinh duyet tu dong gui OPTIONS request (preflight) de kiem tra CORS. Tat ca method deu tra ve header CORS.

---

## NGÀY 6 — OAuth2 Social Login

### 6.1. OAuth2 la gi?

OAuth2 la giao thuc cho phep "dang nhap bang tai khoan X" (Google, GitHub...) ma khong can chia se mat khau.

**Luong co ban:**
```
User → Nhan "Dang nhap Google"
     → Redirect den Google
     → User cho phep
     → Google redirect ve + ma code
     → Backend doi ma code lay token
     → Lay thong tin user (email, name)
     → Tao/Tim user trong DB
     → Tra JWT ve cho frontend
```

### 6.2. OAuth2 vs JWT

| | JWT | OAuth2 |
|---|---|---|
| La gi | Token xac thuc | Giao thuc uy quyen |
| Muc dich | Xac thuc request | Cho phep truy cap tai nguyen |
| Ai phat hanh | Chinh server | OAuth provider (Google...) |
| Su dung | Moi request API | Chi luc dang nhap |

OAuth2 su dung JWT lam access token.

### 6.3. Dependency

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
```

### 6.4. OAuth2 Success Handler

Sau khi user cho phep, Spring Security goi handler. Tai day ta lay thong tin user, tao JWT:

```java
@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        String provider = oauthToken.getAuthorizedClientRegistrationId(); // "google" hoac "github"

        var attributes = oauthToken.getPrincipal().getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        // Tim hoac tao user trong DB
        Optional<User> existingUser = userRepository.findByUsername(email);
        User user = existingUser.orElseGet(() -> {
            User newUser = new User();
            newUser.setUsername(email);
            newUser.setPassword("");         // OAuth khong can password
            newUser.setEmail(email);
            newUser.setFullName(name);
            return userRepository.save(newUser);
        });

        // Tao JWT
        String token = tokenProvider.generateTokenFromUsername(user.getUsername());

        // Redirect ve frontend voi token
        String redirectUrl = String.format(
            "http://localhost:3000/auth/callback?token=%s&userId=%d&email=%s",
            URLEncoder.encode(token), user.getId(), user.getEmail()
        );
        response.sendRedirect(redirectUrl);
    }
}
```

### 6.5. Enable OAuth2 trong SecurityConfig (khi co credentials)

Khi da co `GOOGLE_CLIENT_ID` + `GITHUB_CLIENT_ID`, them vao:

```java
// Trong securityFilterChain(HttpSecurity http)
.oauth2Login(oauth2 -> oauth2
    .authorizationEndpoint(a -> a.baseUri("/oauth2/authorization"))
    .redirectionEndpoint(r -> r.baseUri("/login/oauth2/code/*"))
    .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
    .successHandler(oAuth2SuccessHandler)
)
```

Endpoint OAuth2:
- `/oauth2/authorization/google` — redirect sang Google
- `/login/oauth2/code/google` — Google callback
- Sau khi xu ly → `OAuth2SuccessHandler` chay

---

## TONG KET KIEN THUC DA HOC

### Tien ich & Lenh

```bash
# Chay Spring Boot
./mvnw spring-boot:run

# Khoi tao database
createdb -h localhost -p 5432 -U postgres cuonghoangdev_db

# Reset Flyway
./mvnw flyway:clean && ./mvnw flyway:migrate

# Kill port
lsof -ti:8080 | xargs kill -9
```

### Thu Vien Da Su Dung

| Thu vien | Chuc nang |
|---|---|
| `spring-boot-starter-webmvc` | Web server (Tomcat) + REST |
| `spring-boot-starter-data-jpa` | JPA + Hibernate |
| `spring-boot-starter-security` | Spring Security |
| `spring-boot-starter-flyway` | Database migration |
| `spring-boot-starter-validation` | Bean Validation |
| `spring-boot-starter-oauth2-client` | OAuth2 login |
| `jjwt-api/impl/jackson` | JWT tao/verify |
| `postgresql` | PostgreSQL JDBC driver |
| `flyway-database-postgresql` | Flyway PostgreSQL support |

### Cac Annotation Quan Trong

| Annotation | Dung o dau | Y nghia |
|---|---|---|
| `@SpringBootApplication` | Main class | Entry point |
| `@RestController` | Controller | REST API endpoint |
| `@Service` | Service class | Business logic |
| `@Repository` | Repository | Data access |
| `@Entity` | Entity class | Map voi database table |
| `@Configuration` | Config class | Bean definition |
| `@EnableJpaAuditing` | Config | Bat JPA auto timestamp |
| `@Transactional` | Service method | Unit of work |
| `@Valid` | Request param | Kich hoat validation |
| `@JsonIgnore` | Entity field | Khong tra ve JSON |
| `@RestControllerAdvice` | Exception class | Xu ly loi tap trung |
| `@Component` | Bat ky class | Spring bean |

### HTTP Status Codes

| Code | Nghia | Dung khi nao |
|---|---|---|
| 200 | OK | Thanh cong |
| 201 | Created | Tao moi thanh cong |
| 400 | Bad Request | Validation fail, request sai |
| 401 | Unauthorized | Chua dang nhap (thieu/invalid token) |
| 403 | Forbidden | Da dang nhap nhung khong co quyen |
| 404 | Not Found | Resource khong ton tai |
| 500 | Internal Error | Loi server |

### Cau truc Project

```
src/main/java/com/cuonghoangdev/api_backend/
├── ApiBackendApplication.java          # Main entry point
├── config/
│   ├── JpaConfig.java                 # JPA Auditing
│   └── SecurityConfig.java            # Spring Security
├── controller/
│   ├── AuthController.java            # Login, Register
│   ├── HealthCheckController.java     # Health check
│   ├── RoleController.java            # Role CRUD
│   └── UserController.java            # User CRUD
├── dto/
│   ├── ApiResponse.java               # Response wrapper
│   ├── AuthResponse.java              # Auth result
│   ├── LoginRequest.java              # Login input
│   ├── RegisterRequest.java           # Register input
│   └── UserDto.java                   # User output
├── entity/
│   ├── Role.java                      # Role entity
│   └── User.java                      # User entity
├── exception/
│   ├── BadRequestException.java
│   ├── GlobalExceptionHandler.java
│   └── ResourceNotFoundException.java
├── repository/
│   ├── RoleRepository.java
│   └── UserRepository.java
├── security/
│   ├── CustomOAuth2UserService.java    # OAuth2 user loading
│   ├── CustomUserDetailsService.java  # Load UserDetails
│   ├── JwtAuthenticationFilter.java    # JWT filter
│   ├── JwtTokenProvider.java          # JWT create/verify
│   ├── OAuth2SuccessHandler.java      # OAuth2 callback
│   └── UserPrincipal.java             # User wrapper for Security
└── service/
    ├── AuthService.java               # Auth logic
    ├── RoleService.java               # Role logic
    └── UserService.java               # User logic

src/main/resources/
├── application.yml                    # Cau hinh
└── db/migration/
    └── V1__Init_users_and_roles.sql   # Flyway script
```

---

## NHUNG DIEU CAN NHO

1. **Luon reset DB** khi thay doi migration script: `flyway:clean && flyway:migrate`
2. **JWT secret** phai dai it nhat 256 bit cho HS256
3. **@Transactional** cho tat ca method Service thay doi du lieu
4. **Khong tra password** ve client — dung DTO, khong dung Entity
5. **@JsonIgnore** de tranh circular reference User <-> Role
6. **Spring Boot 4** bat buoc phai dung `spring-boot-starter-*` thay vi dependency thuan
7. **Session la Stateless** khi dung JWT — server khong luu gi

---

## NGÀY 7 — Authorization (Phân Quyền Chi Tiết)

### 7.1. Hai loại phân quyền trong Spring Security

| Loại | Annotation | Dùng khi nào |
|---|---|---|
| Method Security | `@PreAuthorize`, `@Secured` | Tren method cu the |
| URL Security | `.requestMatchers().hasRole()` | Tren endpoint |

### 7.2. @PreAuthorize vs @Secured

```java
// @Secured — chi kiem tra role don gian
@Secured("ROLE_ADMIN")
public void deleteUser(Long id) { }

// @PreAuthorize — bieu thuc SpEL, linh hoat hon
@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(Long id) { }

// Cac bieu thuc thuong dung
@PreAuthorize("hasRole('ADMIN')")                      // Co role ADMIN
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")     // Co 1 trong nhieu role
@PreAuthorize("isAuthenticated()")                       // Da dang nhap
```

**Luu y:** `@EnableMethodSecurity` phai co trong `SecurityConfig` de `@PreAuthorize` hoat dong.

### 7.3. @AuthenticationPrincipal — Lay user hien tai

```java
@GetMapping("/profile")
public ResponseEntity<ApiResponse<UserDto>> getMyProfile(
        @AuthenticationPrincipal UserPrincipal currentUser  // Lay user tu Security Context
) {
    return userService.getUserById(currentUser.getId())
            .map(user -> ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(user))))
            .orElse(ResponseEntity.notFound().build());
}
```

### 7.4. Cham dut login khi bi khoa — UserPrincipal tu DB

Spring Security goi `DaoAuthenticationProvider`, provider goi `UserDetailsService.loadUserByUsername()`. Luc nay `UserPrincipal` doc `accountNonLocked` tu DB:

```java
// UserPrincipal.java
public UserPrincipal(User user) {
    this.accountNonLocked = Boolean.TRUE.equals(user.getAccountNonLocked());
}

@Override
public boolean isAccountNonLocked() {
    return accountNonLocked;  // Tra ve gia tri tu DB, khong phai true cuong
}
```

Neu `isAccountNonLocked()` tra ve `false`, Spring Security tu dong nem `LockedException`.

### 7.5. Tat ca Endpoints Hien Tai

```
PUBLIC:
  GET  /api/v1/system/health
  GET  /api/v1/roles
  POST /api/v1/auth/register
  POST /api/v1/auth/login

PROTECTED — bat ky user nao:
  GET  /api/v1/profile              ← Xem profile cua minh
  PATCH /api/v1/profile            ← Sua profile cua minh

PROTECTED — chi ADMIN:
  GET  /api/v1/admin/users              ← Xem tat ca user
  GET  /api/v1/admin/users/count        ← Dem user
  DELETE /api/v1/admin/users/{id}       ← Xoa user
  PATCH /api/v1/admin/users/{id}/lock   ← Khoa user
  PATCH /api/v1/admin/users/{id}/unlock ← Mo khoa user
```

### 7.6. Them quyen ADMIN bang SQL

```sql
-- Tao admin
INSERT INTO users (username, password, email, full_name)
VALUES ('admin', '$2a$10$...', 'admin@cuonghoang.dev', 'Admin');

-- Gan role ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN';
```

---

## NGÀY 8 — CRUD Nâng Cao (Admin Quản Lý User)

### 8.1. Admin Tạo User

Admin co the tao user truc tiep, gan role.

```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ApiResponse<UserDto>> createUser(
        @Valid @RequestBody CreateUserRequest request) {

    if (userRepository.existsByUsername(request.getUsername())) {
        throw new BadRequestException("Username da ton tai");
    }

    User user = new User();
    user.setUsername(request.getUsername());
    user.setPassword(request.getPassword()); // se duoc BCrypt encode trong service
    user.setEmail(request.getEmail());

    // Tim role
    Role role = roleRepository.findByName(request.getRoleName())
            .orElseThrow(() -> new BadRequestException("Role khong ton tai"));

    user.getRoles().add(role);
    User saved = userService.createUser(user);

    return ResponseEntity.ok(ApiResponse.ok("Tao user thanh cong", UserDto.fromEntity(saved)));
}
```

### 8.2. Admin Sửa User

Admin sua bat ky truong nao cua user bat ky (ngoai tru chinh minh).

```java
@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ApiResponse<UserDto>> updateUser(
        @PathVariable Long id,
        @Valid @RequestBody UpdateUserRequest request,
        @AuthenticationPrincipal UserPrincipal currentUser) {

    // Khong cho sua chinh minh tai day
    if (currentUser.getId().equals(id)) {
        throw new BadRequestException("Ban khong the sua chinh minh tai day");
    }

    User user = userRepository.findById(id)...;

    // Chi cap nhat nhung truong duoc truyen
    if (request.getUsername() != null) user.setUsername(request.getUsername());
    if (request.getEmail() != null) user.setEmail(request.getEmail());
    if (request.getPassword() != null) user.setPassword(request.getPassword());
    if (request.getEnabled() != null) user.setEnabled(request.getEnabled());
    if (request.getAccountNonLocked() != null) user.setAccountNonLocked(request.getAccountNonLocked());
    if (request.getRoleName() != null) {
        Role newRole = roleRepository.findByName(request.getRoleName())...;
        user.getRoles().clear();
        user.getRoles().add(newRole);
    }

    User saved = userService.updateUser(id, user);
    return ResponseEntity.ok(ApiResponse.ok("Cap nhat user thanh cong", UserDto.fromEntity(saved)));
}
```

### 8.3. DTO Request cho Create va Update

```java
// CreateUserRequest — tat ca truong deu bat buoc
public class CreateUserRequest {
    @NotBlank @Size(min=3, max=50) private String username;
    @NotBlank @Size(min=6) private String password;
    @NotBlank @Email private String email;
    private String fullName;
    private String roleName;  // ROLE_USER hoac ROLE_ADMIN
}

// UpdateUserRequest — tat ca truong deu tuy chon
public class UpdateUserRequest {
    @Size(min=3, max=50) private String username;
    @Email private String email;
    private String fullName;
    @Size(min=6) private String password;
    private Boolean enabled;
    private Boolean accountNonLocked;
    private String roleName;
}
```

### 8.4. Phan biet Create vs Update

| Hanh dong | API | Dung |
|---|---|---|
| Tao moi user | `POST /admin/users` | `CreateUserRequest` |
| Sua user | `PUT /admin/users/{id}` | `UpdateUserRequest` |
| Sua chinh minh | `PATCH /profile` | `ProfileController` |

---

## NGÀY 9 — Phân Trang & Tìm Kiếm

### 9.1. Pageable — Phan trang trong Spring Data

```java
// Trong Controller
@GetMapping
public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getAllUsers(
        @RequestParam(defaultValue = "0") int page,      // Trang hien tai (0-based)
        @RequestParam(defaultValue = "10") int size,    // So phan tu/trang
        @RequestParam(defaultValue = "id") String sortBy,  // Cot de sort
        @RequestParam(defaultValue = "asc") String sortDir  // asc hoac desc
) {
    Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

    Pageable pageable = PageRequest.of(page, size, sort);
    Page<User> userPage = userRepository.findAll(pageable);

    PageResponse<UserDto> response = PageResponse.from(userPage, UserDto::fromEntity);
    return ResponseEntity.ok(ApiResponse.ok(response));
}
```

### 9.2. PageResponse — DTO phan trang

```java
public class PageResponse<T> {
    private List<T> content;        // Du lieu trang hien tai
    private int pageNumber;         // Trang hien tai (0-based)
    private int pageSize;           // So phan tu/trang
    private long totalElements;     // Tong so phan tu
    private int totalPages;         // Tong so trang
    private boolean first;         // La trang dau tien?
    private boolean last;           // La trang cuoi cung?

    // Converter tu Page<Entity> sang PageResponse<DTO>
    public static <E, R> PageResponse<R> from(Page<E> page, Function<E, R> mapper) {
        List<R> content = page.getContent().stream().map(mapper).collect(Collectors.toList());
        return new PageResponse<>(page, content);
    }
}
```

### 9.3. Tim kiem trong Repository

```java
// Spring Data tu dong implement theo ten method
Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
        String username, String email, Pageable pageable);

// Su dung trong Controller
if (keyword != null && !keyword.isBlank()) {
    userPage = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            keyword, keyword, pageable);
} else {
    userPage = userRepository.findAll(pageable);
}
```

### 9.4. Quy tac dat ten method Spring Data JPA

```
findBy + TenTruong +Containing        → Tim like '%ten%'
findBy + TenTruong +StartingWith     → Tim like 'ten%'
findBy + TenTruong +EndingWith       → Tim like '%ten'
findBy + TenTruong +IgnoreCase       → Tim khong phan biet hoa/thuong
findBy + Truong1 +And + Truong2     → WHERE truong1 = ? AND truong2 = ?
findBy + Truong1 +Or + Truong2       → WHERE truong1 = ? OR truong2 = ?
```

### 9.5. Vi du query params

```
GET /api/v1/admin/users?page=0&size=5&sortBy=username&sortDir=asc
GET /api/v1/admin/users?page=1&size=10&keyword=admin
GET /api/v1/admin/users?keyword=hoang&page=0&size=20&sortBy=createdAt&sortDir=desc
```

### 9.6. Response JSON phan trang

```json
{
    "success": true,
    "message": "Thành công",
    "data": {
        "content": [ ... ],
        "pageNumber": 0,
        "pageSize": 10,
        "totalElements": 3,
        "totalPages": 1,
        "first": true,
        "last": true
    },
    "timestamp": "2026-05-27T19:32:00"
}
```

---

## NGÀY 10 — Upload File + Storage

### 10.1. Bang file_attachments

```sql
CREATE TABLE file_attachments (
    id              BIGSERIAL PRIMARY KEY,
    original_name   VARCHAR(255) NOT NULL,
    stored_name     VARCHAR(255) NOT NULL,   -- Ten file da ma hoa (tranh trung)
    file_path       VARCHAR(500) NOT NULL,     -- Duong dan vat ly tren disk
    content_type    VARCHAR(100) NOT NULL,
    file_size       BIGINT NOT NULL,
    uploaded_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_category   VARCHAR(50)
);
```

**Diem quan trong:** Luu `stored_name` (ten file da ma hoa) thay vi ten goc. Tranh trung lap khi nhieu user upload cung ten file.

### 10.2. FileStorageService — Luu file len disk

```java
@Service
public class FileStorageService {

    private final Path rootLocation;

    public FileStorageService(
            @Value("${app.file.storage-path:./uploads}") String storagePath) {
        this.rootLocation = Paths.get(storagePath).toAbsolutePath().normalize();
        Files.createDirectories(rootLocation);  // Tao thu muc neu chua co
    }

    @Transactional
    public FileAttachment store(MultipartFile file, Long userId, String category) {
        String originalName = file.getOriginalFilename();

        // Tao ten file moi de tranh trung lap
        String ext = originalName.substring(originalName.lastIndexOf('.'));
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String storedName = timestamp + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

        // Luu vao thu muc theo category
        Path destinationDir = rootLocation.resolve(category != null ? category : "misc");
        Files.createDirectories(destinationDir);
        Path destinationFile = destinationDir.resolve(storedName);

        // Copy file
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
        }

        // Luu metadata vao DB
        FileAttachment attachment = new FileAttachment();
        attachment.setOriginalName(originalName);
        attachment.setStoredName(storedName);
        attachment.setFilePath(destinationFile.toString());
        attachment.setContentType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setUploadedBy(userId);

        return fileAttachmentRepository.save(attachment);
    }
}
```

### 10.3. Upload endpoint

```java
@PostMapping("/upload")
public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
        @RequestParam("file") MultipartFile file,  // Form-data field "file"
        @RequestParam(value = "category", required = false) String category,
        @AuthenticationPrincipal UserPrincipal currentUser) {

    FileAttachment attachment = fileStorageService.store(file, currentUser.getId(), category);

    FileUploadResponse response = new FileUploadResponse(
            attachment.getId(),
            attachment.getOriginalName(),
            attachment.getStoredName(),
            attachment.getContentType(),
            attachment.getFileSize(),
            "/api/v1/files/" + attachment.getStoredName(),
            attachment.getUploadedAt().toString()
    );

    return ResponseEntity.ok(ApiResponse.ok("Upload thanh cong", response));
}
```

### 10.4. Download endpoint

```java
@GetMapping("/{storedName}")
public ResponseEntity<Resource> downloadFile(@PathVariable String storedName) {
    Resource resource = fileStorageService.loadAsResource(storedName);
    FileAttachment attachment = fileStorageService.findByStoredName(storedName);

    return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(attachment.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + attachment.getOriginalName() + "\"")
            .body(resource);
}
```

### 10.5. Flyway Migration V2

Khi co bang/thay doi DB moi, tao file migration moi:

```
db/migration/
  V1__Init_users_and_roles.sql    ← V1
  V2__Add_file_attachments_table.sql  ← V2 (moi)
```

Khi reset DB, Flyway chay tat ca migration tu dau.

### 10.6. Cau hinh storage path trong application.yml

```yaml
app:
  file:
    storage-path: ./uploads    # Thu muc luu file (co the doi thanh /var/uploads)
```

---

## NGÀY 11 — Redis Cache + Blog System

### 11.1. Redis la gi? Tai sao can no?

Redis la "In-Memory Database" — luu du lieu trong RAM thay vi dia cu. Toc do doc/ghi nhanh hon PostgreSQL nhieu lan.

**Truoc khi co Redis:**
```
Client → Backend → PostgreSQL → Backend → Client
         (moi request deu doc tu dia, chan 5-50ms)
```

**Sau khi co Redis:**
```
Client → Backend → Redis Cache → Client
         (cache hit: < 1ms)

Client → Backend → PostgreSQL → Redis → Client
         (cache miss: lan dau doc tu dia, luu vao Redis)
```

**Trong du an nay:**
- Trang chu blog: 4 categories → cache 6h
- Danh sach bai viet: cache 30 phut
- Neu admin tao/sua/xoa bai → cache tu dong xoa (@CacheEvict)

### 11.2. Cai dat Redis tren macOS

```bash
# Kiem tra da cai chua
which redis-server

# Neu chua, cai bang Homebrew
brew install redis
brew services start redis

# Kiem tra ket noi
redis-cli ping
# PONG → Redis dang chay
```

### 11.3. Dependency

```xml
<!-- Redis cache abstraction -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>

<!-- Redis client -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<!-- Jackson JSR310 (Java 8 time types) -->
<dependency>
    <groupId>com.fasterxml.jackson.datatype</groupId>
    <artifactId>jackson-datatype-jsr310</artifactId>
</dependency>
```

### 11.4. Cau hinh Redis trong application.yml

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 60000

  cache:
    type: redis
    redis:
      time-to-live: 3600000    # 1 gio mac dinh
      cache-null-values: false # Khong cache gia tri null
```

### 11.5. RedisCacheConfig — Cau hinh Cache Manager

```java
@Configuration
public class RedisCacheConfig {

    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory,
                                                       ObjectMapper redisObjectMapper) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer(redisObjectMapper));
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory,
                                     ObjectMapper redisObjectMapper) {
        GenericJackson2JsonRedisSerializer serializer =
            new GenericJackson2JsonRedisSerializer(redisObjectMapper);

        // Cau hinh TTL khac nhau cho tung cache
        RedisCacheConfiguration postsConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))  // Bai viet: 30 phut
                .serializeKeysWith(...)
                .serializeValuesWith(...);

        RedisCacheConfiguration categoriesConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(6))  // Categories: 6 gio
                .serializeKeysWith(...)
                .serializeValuesWith(...);

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("posts", postsConfig)
                .withCacheConfiguration("categories", categoriesConfig)
                .build();
    }
}
```

**Diem quan trong:**
- `GenericJackson2JsonRedisSerializer` — chuyen object Java thanh JSON luu vao Redis
- `JavaTimeModule` — ho tro serializable cho `LocalDateTime`
- Tung cache co TTL khac nhau: posts 30 phut, categories 6 gio

### 11.6. Bat Cache trong Application

```java
@SpringBootApplication
@EnableCaching  // ← Bat cache o day
public class ApiBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiBackendApplication.class, args);
    }
}
```

### 11.7. @Cacheable, @CacheEvict — Annotation caching

```java
@Service
public class PostService {

    // Lan dau goi: doc tu DB, luu vao Redis
    // Lan sau goi: doc tu Redis (khong can DB)
    @Cacheable(value = "posts", key = "'published:page:' + #page + ':size:' + #size")
    public PageResponse<PostDto> getPublishedPosts(int page, int size) {
        // Chi chay khi chua co trong cache
        Pageable pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        Page<Post> posts = postRepository.findByStatus("PUBLISHED", pageable);
        return toPageResponse(posts);
    }

    // Xoa toan bo cache "posts" khi tao bai moi
    @Caching(evict = {
        @CacheEvict(value = "posts", allEntries = true)
    })
    public PostDto createPost(CreatePostRequest request, Long authorId) {
        // ...
    }

    // Xoa cache khi xoa bai
    @Caching(evict = {
        @CacheEvict(value = "posts", allEntries = true)
    })
    public void deletePost(Long id) {
        // ...
    }

    // Cache cho featured posts
    @Cacheable(value = "posts", key = "'featured'")
    public List<PostDto> getFeaturedPosts() {
        // ...
    }

    // Cache categories — 6 gio
    @Cacheable(value = "categories", key = "'all'")
    public List<CategoryDto> getAllCategories() {
        // ...
    }

    // Xoa categories khi co thay doi
    @Caching(evict = {
        @CacheEvict(value = "categories", allEntries = true)
    })
    public CategoryDto createCategory(String name, String slug, String description) {
        // ...
    }
}
```

### 11.8. Cấu trúc Cache Key

| Cache | Key | TTL | Mục đích |
|---|---|---|---|
| posts | `posts::published:page:0:size:10` | 30 phut | Danh sach bai da xuat ban |
| posts | `posts::featured` | 30 phut | Bai viet noi bat |
| posts | `posts::slug:ten-bai` | 30 phut | Mot bai viet cu the |
| posts | `posts::search:java:cat:technology:page:0:size:10` | 30 phut | Ket qua tim kiem |
| categories | `categories::all` | 6 gio | Tat ca categories |

### 11.9. Kiem tra Redis thuc te

```bash
# Xem tat ca cache
redis-cli keys '*'

# Xem TTL cua mot cache
redis-cli ttl 'categories::all'

# Xoa mot cache cu the
redis-cli del 'posts::published:page:0:size:10'

# Xoa toan bo cache
redis-cli flushall

# Xem noi dung cache
redis-cli get 'categories::all'
```

### 11.10. Bang Blog — Migration V4

```sql
-- V4: Bang Blog (Categories + Posts + Tags)
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id           BIGSERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) NOT NULL UNIQUE,
    excerpt      TEXT,
    content      TEXT NOT NULL,
    thumbnail_url VARCHAR(500),
    status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    category_id  BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    author_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    view_count   INT NOT NULL DEFAULT 0,
    is_featured  BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(50) NOT NULL UNIQUE,
    slug      VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_tags (
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Index
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_is_featured ON posts(is_featured);

-- Du lieu mac dinh
INSERT INTO categories (name, slug, description) VALUES
    ('Technology',  'technology',  'Bai viet ve cong nghe, lap trinh, framework moi'),
    ('Lifestyle',   'lifestyle',  'Chia se ve phong cach song, so thich, trai nghiem'),
    ('Business',    'business',   'Kien thuc kinh doanh, khoi nghiep, tai chinh'),
    ('Education',   'education',  'Hoc tap, phat trien ban than, ky nang mem');
```

### 11.11. API Endpoints Blog

```
PUBLIC (khong can dang nhap):
  GET  /api/v1/blog/posts              ← Danh sach bai da xuat ban (phan trang)
  GET  /api/v1/blog/posts/featured     ← Bai viet noi bat
  GET  /api/v1/blog/posts/popular      ← Bai viet nhieu view nhat
  GET  /api/v1/blog/posts/{slug}       ← Mot bai viet
  GET  /api/v1/blog/posts/search       ← Tim kiem bai viet
  GET  /api/v1/blog/categories         ← Tat ca categories
  GET  /api/v1/blog/categories/{id}    ← Mot category

ADMIN (can dang nhap, role ADMIN/EDITOR):
  GET    /api/v1/blog/admin/posts       ← Tat ca bai (ke ca draft)
  POST   /api/v1/blog/admin/posts       ← Tao bai moi
  PUT    /api/v1/blog/admin/posts/{id} ← Sua bai
  DELETE /api/v1/blog/admin/posts/{id}  ← Xoa bai
  POST   /api/v1/blog/admin/categories ← Tao category
  PUT    /api/v1/blog/admin/categories/{id}
  DELETE /api/v1/blog/admin/categories/{id}
```

### 11.12. Chi so (index) cho hieu nang

```sql
-- Tat ca deu da tao trong V4 migration
CREATE INDEX idx_posts_category_id  ON posts(category_id);
CREATE INDEX idx_posts_author_id    ON posts(author_id);
CREATE INDEX idx_posts_status       ON posts(status);
CREATE INDEX idx_posts_slug         ON posts(slug);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_is_featured ON posts(is_featured);
CREATE INDEX idx_tags_slug ON tags(slug);
```

**Tai sao can index:**
- `idx_posts_status` — loc nhanh bai `PUBLISHED`
- `idx_posts_published_at` — sort theo thoi gian
- `idx_posts_category_id` — loc theo danh muc

### 11.13. Kieer thuc bổ sung

**@ManyToMany voi Join Table:**
```java
@Entity
public class Post {
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "post_tags",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    public void addTag(Tag tag) {
        this.tags.add(tag);
        tag.getPosts().add(this);
    }

    public void removeTag(Tag tag) {
        this.tags.remove(tag);
        tag.getPosts().remove(this);
    }
}
```

**Trong MySQL/MariaDB:** Neu gap loi "Unique violation", kiem tra bang trung gian co bi trung key khong.

---

## CAC NGAY TIEP THEO

- **Ngày 12:** pgvector + Spring AI (RAG AI Chatbot) ✅
- **Ngày 13-14:** RAG Implementation (Embedding + Vector Search)
- **Ngày 15-30:** Frontend Next.js + Kết nối Backend + Deploy

---

## NGÀY 12 — pgvector + Spring AI (Vector Database)

### 12.1. pgvector la gi?

pgvector la phan mo rong (extension) cho PostgreSQL, cho phep luu tru va tim kiem vector so hoc - thanh phan quan trong cua AI/ML.

**Tai sao can pgvector:**
```
Khong co pgvector:
  - Tim kiem theo tu khoa chinh xac (keyword matching)
  - "Java Spring Boot" chi tra ve bai viet co tu "Java Spring Boot"
  - Khong hieu "Spring Boot" = "Framework Spring"

Co pgvector:
  - Tim kiem ngữ nghĩa (semantic search)
  - "Spring Boot framework" tra ve ca "Java Spring Boot", "Framework Spring", "Spring MVC"
  - AI hieu y nghia, khong chi tu khoa
```

### 12.2. Embedding la gi?

Embedding la qua trinh chuyen doi text thanh vector so (array of numbers). Cac text co nghia tuong tu se co vector gan nhau.

```
Text: "Java Spring Boot tutorial"
Embedding: [0.123, -0.456, 0.789, ...]  (1536 chiều với OpenAI text-embedding-3-small)

Text: "How to learn Spring framework"
Embedding: [0.124, -0.455, 0.790, ...]  ← Vector gần với trên!

Text: "Python programming guide"
Embedding: [-0.999, 0.001, 0.123, ...]  ← Vector khac xa
```

**Embedding models:**
| Model | Dimensions | Chi phí | Chat cua |
|-------|-----------|---------|----------|
| text-embedding-3-small | 1536 | Rẻ | OpenAI |
| text-embedding-3-large | 3072 | Đắt | OpenAI |
| text-embedding-ada-002 | 1536 | Trung bình | OpenAI (legacy) |

### 12.3. Vector Similarity — Cosine Distance

pgvector su dung Cosine Similarity de do khoang cach vector:

```
Cosine Similarity = 1.0  → Vector giong nhau tuyet doi
Cosine Similarity = 0.7  → Vector tuong dong
Cosine Similarity = 0.0  → Vector khong lien quan
Cosine Similarity = -1.0 → Vector nguoc nhau tuyet doi
```

Trong pgvector, `<=>` la toan tu cosine distance:

```sql
-- Tim document gan nhat voi query
SELECT content, 1 - (embedding <=> '[0.123,...]::vector') AS similarity
FROM document_chunks
ORDER BY embedding <=> '[0.123,...]::vector'
LIMIT 5;
```

### 12.4. Kich hoat pgvector

```sql
-- Tao extension (can quyen superuser)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tao bang voi column vector
CREATE TABLE document_chunks (
    id              BIGSERIAL PRIMARY KEY,
    content         TEXT NOT NULL,
    embedding       VECTOR(1536)  -- 1536 chiều cho text-embedding-3-small
);

-- Index HNSW (Hierarchical Navigable Small World)
-- Toc do tim kiem nhanh hon IVFFlat nhung ton nhieu bo nho hon
CREATE INDEX idx_embedding ON document_chunks
    USING hnsw (embedding vector_cosine_ops);
```

### 12.5. Spring AI — Kien thuc tong quan

Spring AI la framework Java de tich hop AI vao Spring Boot:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-pgvector-store</artifactId>
</dependency>
```

### 12.6. Cau hinh Spring AI trong application.yml

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4o-mini
          temperature: 0.7
    vectorstore:
      pgvector:
        index-type: HNSW
        distance-type: COSINE_DISTANCE
        dimension: 1536

app:
  ai:
    embedding:
      dimensions: 1536
```

### 12.7. Tao Embedding voi Spring AI

```java
@Service
public class EmbeddingService {

    private final EmbeddingModel embeddingModel;

    public EmbeddingService(
            @Value("${spring.ai.openai.api-key}") String apiKey) {
        this.embeddingModel = OpenAiEmbeddingModel.withApiKey(apiKey);
    }

    public float[] createEmbedding(String text) {
        EmbeddingRequest request = new EmbeddingRequest(
            List.of(text), 
            OpenAiApi.EmbeddingModel.TEXT_EMBEDDING_3_SMALL
        );
        EmbeddingResponse response = embeddingModel.call(request);
        return response.getResult().getEmbedding();
    }
}
```

### 12.8. Semantic Search voi pgvector

```java
@Service
public class VectorSearchService {

    private final JdbcTemplate jdbcTemplate;
    private final EmbeddingService embeddingService;

    public List<SearchResult> semanticSearch(String query, int topK) {
        // Tạo embedding cho query
        float[] queryEmbedding = embeddingService.createEmbedding(query);

        // SQL tim kiem vector
        String sql = """
            SELECT id, content, metadata, document_id,
                   1 - (embedding <=> ?::vector) AS similarity
            FROM document_chunks
            WHERE document_type = ?
            ORDER BY embedding <=> ?::vector
            LIMIT ?
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            SearchResult result = new SearchResult();
            result.setContent(rs.getString("content"));
            result.setSimilarity(rs.getDouble("similarity"));
            return result;
        }, vectorToString(queryEmbedding), documentType, 
           vectorToString(queryEmbedding), topK);
    }
}
```

### 12.9. RAG — Retrieval Augmented Generation

RAG la ky thuat ket hop tim kiem vector voi sinh text:

```
1. User hoi: "Kỹ năng Java của CuongHoangDev là gì?"

2. Chuyen cau hoi thanh embedding:
   "Kỹ năng Java..." → [0.123, -0.456, ...]

3. Tim kiem vector trong PostgreSQL:
   Tìm 5 document có vector gần nhất

4. Dựa vào context để tạo prompt:
   Prompt = "Dựa vào thông tin sau về kỹ năng Java của CuongHoangDev: 
            [context từ bước 3], hãy trả lời câu hỏi..."

5. Gọi LLM (GPT-4o-mini) để sinh câu trả lời

6. Trả về câu trả lời cho user
```

### 12.10. Chuyen doi float[] <-> String

PostgreSQL vector format: `[0.123,-0.456,0.789]`

```java
// float[] -> String
public String vectorToString(float[] vector) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < vector.length; i++) {
        sb.append(vector[i]);
        if (i < vector.length - 1) sb.append(",");
    }
    sb.append("]");
    return sb.toString();
}

// String -> float[]
public float[] stringToVector(String vectorStr) {
    String trimmed = vectorStr.replace("[", "").replace("]", "");
    String[] parts = trimmed.split(",");
    float[] result = new float[parts.length];
    for (int i = 0; i < parts.length; i++) {
        result[i] = Float.parseFloat(parts[i].trim());
    }
    return result;
}
```

### 12.11. Chunking — Chia van ban nho

Documents dai can duoc chia thanh chunks nho hon:

```
Document goc (5000 ky tu):
  "Spring Boot la framework Java giup tao ung dung web nhanh chong..."

Chunks (1000 ky tu, 200 overlap):
  Chunk 0: "Spring Boot la framework Java giup tao ung dung web..."
  Chunk 1: "...ung dung web nhanh chong. No cung cap autoconfiguration..."
  Chunk 2: "...autoconfiguration va embedded server..."
```

**Tai sao can overlap:**
- Thong tin quan trong o cuoi chunk 0 co the bi cat
- Overlap 200 ky tu dam bao khong mat context

### 12.12. Bang du lieu cho AI

```sql
-- Bang luu chunks da embed
CREATE TABLE document_chunks (
    id              BIGSERIAL PRIMARY KEY,
    content         TEXT NOT NULL,
    metadata        JSONB,              -- {title, author, url...}
    embedding       VECTOR(1536),       -- Vector embedding
    chunk_index     INT DEFAULT 0,
    document_id     VARCHAR(100),      -- ID document goc
    document_type   VARCHAR(50)         -- posts, profile, skills...
);

-- Bang chat sessions
CREATE TABLE chat_sessions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id),
    session_id      VARCHAR(100) UNIQUE,
    title           VARCHAR(255)
);

-- Bang tin nhan chat
CREATE TABLE chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    session_id      VARCHAR(100),
    role            VARCHAR(20),       -- user, assistant
    content         TEXT NOT NULL,
    created_at      TIMESTAMP
);
```

### 12.13. Cau hinh AI (Admin)

```sql
-- Bang cau hinh AI
CREATE TABLE ai_config (
    config_key      VARCHAR(100) UNIQUE,
    config_value    TEXT,
    description     VARCHAR(500)
);

-- Du lieu mac dinh
INSERT INTO ai_config (config_key, config_value) VALUES
    ('embedding_model', 'text-embedding-3-small'),
    ('chat_model', 'gpt-4o-mini'),
    ('chunk_size', '1000'),
    ('chunk_overlap', '200'),
    ('similarity_threshold', '0.7');
```

### 12.14. API Endpoints AI

```
PUBLIC:
  POST /api/v1/ai/chat              ← Gui tin nhan chat (RAG)

PROTECTED:
  GET  /api/v1/ai/chat/history/{sessionId}   ← Lich su chat
  GET  /api/v1/ai/chat/sessions             ← Danh sach sessions
  DELETE /api/v1/ai/chat/sessions/{sessionId} ← Xoa session

ADMIN:
  POST   /api/v1/ai/admin/documents          ← Index document
  PUT    /api/v1/ai/admin/documents/{id}    ← Tai index
  DELETE /api/v1/ai/admin/documents/{id}     ← Xoa khoi index
  GET    /api/v1/ai/admin/documents          ← Xem tat ca chunks
  GET    /api/v1/ai/admin/stats              ← Thong ke index
```

### 12.15. Minh hoa RAG flow day du

```java
@Service
public class AIChatService {

    public ChatResponse chat(ChatRequest request) {
        // 1. Tim kiem context tu vector DB
        List<SearchResult> results = vectorSearchService.semanticSearch(
            request.getMessage(), 5, "posts", 0.7);

        // 2. Xay dung context
        String context = buildContext(results);

        // 3. Xay dung prompt voi RAG
        String systemPrompt = """
            Ban la tro ly AI cua CuongHoangDev.
            Dua vao thong tin sau:
            """ + context + """
            Hay tra loi cau hoi cua nguoi dung.
            """;

        // 4. Goi LLM
        String answer = chatClient.prompt()
            .system(systemPrompt)
            .user(request.getMessage())
            .call()
            .content();

        // 5. Tra ve
        return new ChatResponse(answer, sessionId);
    }
}
```

### 12.16. Lenh huu ich

```bash
# Kiem tra pgvector da kich hoat chua
psql -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Reset migration
./mvnw flyway:clean && ./mvnw flyway:migrate

# Kiem tra vector search
psql -c "SELECT embedding FROM document_chunks LIMIT 1;"
```

### 12.17. Loi thuong gap

| Loi | Nguyen nhan | Cach fix |
|-----|-------------|----------|
| `extension "vector" does not exist` | Chua tao extension | `CREATE EXTENSION vector;` |
| `dimension mismatch` | Embedding dimension sai | Kiem tra app.ai.embedding.dimensions |
| `Invalid vector literal` | Format vector sai | Dung format `[1.0,2.0,...]` |
| `out of memory` | Qua nhieu embeddings | Giam topK hoac tang overlap |

---

## NGÀY 13 — Tự động nạp tri thức (Knowledge Ingestion)

### 13.1. Khai niem Knowledge Ingestion

Knowledge Ingestion la qua trinh tu dong dua du lieu nguon (posts, profile, skills, projects) vao vector database de AI co the tim kiem va tra loi cau hoi.

**Tai sao can tu dong ingestion:**
```
Thủ công (truoc):
  1. Tao post moi
  2. Copy noi dung
  3. Go qua API de index
  4. Lap di lap lai...

Tu dong (hien tai):
  1. Tao post moi
  2. PostService tu dong index
  3. Xong!
```

### 13.2. Auto-Indexing trong Service

```java
@Service
public class PostService {

    private final DocumentIndexingService documentIndexingService;

    // Khi tao post
    public PostDto createPost(CreatePostRequest request, Long authorId) {
        Post saved = postRepository.save(post);

        // Tu dong index vao vector DB
        if ("PUBLISHED".equals(saved.getStatus())) {
            indexPostToVector(saved);
        }

        return toDto(saved);
    }

    // Khi cap nhat post
    public PostDto updatePost(Long id, UpdatePostRequest request) {
        Post saved = postRepository.save(post);

        // Re-index
        if ("PUBLISHED".equals(saved.getStatus())) {
            indexPostToVector(saved);
        }

        return toDto(saved);
    }

    // Khi xoa post
    public void deletePost(Long id) {
        deletePostFromVector(id);  // Xoa khoi vector DB
        postRepository.delete(post);
    }
}
```

### 13.3. Cau truc noi dung index

Khi index mot post, ta can xay dung noi dung va metadata:

```java
private void indexPostToVector(Post post) {
    // Xay dung noi dung de index
    StringBuilder content = new StringBuilder();
    content.append(post.getTitle()).append(". ");
    if (post.getExcerpt() != null) {
        content.append(post.getExcerpt()).append(" ");
    }
    content.append(post.getContent());

    // Xay dung metadata
    Map<String, Object> metadata = new HashMap<>();
    metadata.put("title", post.getTitle());
    metadata.put("slug", post.getSlug());
    metadata.put("category", post.getCategory().getName());
    metadata.put("author", authorName);
    metadata.put("tags", List.of("java", "spring"));

    // Index
    documentIndexingService.indexDocument(request);
}
```

### 13.4. KnowledgeIngestionService

Service tong hop de quan ly viec index nhieu loai tai lieu:

```java
@Service
public class KnowledgeIngestionService {

    public int indexAllPublishedPosts() {
        List<Post> posts = postRepository.findByStatus("PUBLISHED");
        int count = 0;
        for (Post post : posts) {
            indexPost(post);
            count++;
        }
        return count;
    }

    public void indexUserProfile(User user) {
        StringBuilder content = new StringBuilder();
        content.append("Ho va ten: ").append(user.getFullName()).append(". ");
        content.append("Email: ").append(user.getEmail()).append(". ");

        // Index profile
        documentIndexingService.indexDocument(request);
    }
}
```

### 13.5. Bang Skills va Projects

```sql
-- Bang skills
CREATE TABLE skills (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    category        VARCHAR(50),   -- 'language', 'framework', 'tool'
    proficiency     INT DEFAULT 3, -- 1-5
    description     TEXT,
    years_experience INT DEFAULT 0,
    is_featured     BOOLEAN DEFAULT FALSE
);

-- Bang projects
CREATE TABLE projects (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    content         TEXT,
    tech_stack      TEXT,          -- comma-separated
    role            VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'COMPLETED',
    is_featured     BOOLEAN DEFAULT FALSE
);

-- Bang trung gian
CREATE TABLE project_skills (
    project_id      BIGINT REFERENCES projects(id),
    skill_id        BIGINT REFERENCES skills(id),
    PRIMARY KEY (project_id, skill_id)
);
```

### 13.6. DataSeedingService

Chay khi ung dung khoi dong:

```java
@Configuration
public class DataSeedingService {

    @Bean
    public CommandLineRunner seedAIConfig(AIConfigRepository repo) {
        return args -> {
            // Seed AI config mac dinh
            seedConfigIfNotExists(repo, "embedding_model", "text-embedding-3-small");
            seedConfigIfNotExists(repo, "chat_model", "gpt-4o-mini");
            seedConfigIfNotExists(repo, "temperature", "0.7");
        };
    }

    @Bean
    public CommandLineRunner indexKnowledgeOnStartup(
            KnowledgeIngestionService service) {
        return args -> {
            // Chi chay neu AI_AUTO_INDEX=true
            service.indexAllKnowledge();
        };
    }
}
```

### 13.7. Cau hinh application.yml

```yaml
app:
  ai:
    auto-index-on-startup: ${AI_AUTO_INDEX:false}
    seed-default-config: true
```

**Cach su dung:**
```bash
# Khong auto index khi khoi dong (mac dinh)
./mvnw spring-boot:run

# Auto index khi khoi dong
AI_AUTO_INDEX=true ./mvnw spring-boot:run
```

### 13.8. Admin API cho Knowledge Management

```
POST /api/v1/ai/admin/knowledge/index-all     ← Index tat ca
POST /api/v1/ai/admin/knowledge/reindex-all  ← Tai index
DELETE /api/v1/ai/admin/knowledge/clear-all   ← Xoa het
POST /api/v1/ai/admin/knowledge/index-posts  ← Index posts
POST /api/v1/ai/admin/knowledge/index-profiles ← Index profiles

GET  /api/v1/ai/admin/config                ← Xem AI config
PUT  /api/v1/ai/admin/config/{key}          ← Cap nhat config
```

### 13.9. Chu y quan trong

**1. Async Indexing (neu can):**
```java
@Async
public void indexPostToVector(Post post) {
    // Chi chay neu can, khong block request
}
```

**2. Error Handling:**
```java
try {
    documentIndexingService.indexDocument(request);
} catch (Exception e) {
    // Khong throw de khong anh huong den viec luu post
    log.error("Loi index: {}", e.getMessage());
}
```

**3. Batch Indexing:**
```java
// Neu co nhieu documents, nen index theo batch
for (List<Post> batch : Lists.partition(posts, 10)) {
    for (Post post : batch) {
        indexPost(post);
    }
}
```

### 13.10. Lenh huu ich

```bash
# Kich hoat pgvector (neu chua co)
psql -d cuonghoangdev_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Reset migration
./mvnw flyway:clean && ./mvnw flyway:migrate

# Kiem tra so luong chunks
psql -d cuonghoangdev_db -c "SELECT document_type, COUNT(*) FROM document_chunks GROUP BY document_type;"

# Test index truc tiep
curl -X POST http://localhost:8080/api/v1/ai/admin/knowledge/index-posts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## NGÀY 14 — Hoàn thiện RAG API (Streaming + Feedback)

### 14.1. Streaming la gi?

Streaming la ky thuat gui du lieu theo tung phan nho, thay vi cho load xong roi moi tra ve. Nho do, nguoi dung thay chu chay tu tu nhu ChatGPT.

```
Non-Streaming (truoc):
  1. User gui cau hoi
  2. Server xu ly... (cho 5 giay)
  3. Tra ve cau tra loi day du
  4. Hien thi 1 lan

Streaming (hien tai):
  1. User gui cau hoi
  2. Server xu ly...
  3. Tra ve tung tu mot: "Xin" -> "Xin chao" -> "Xin chao, toi" -> ...
  4. Hien thi theo thoi gian thuc
```

### 14.2. Server-Sent Events (SSE)

SSE la cong nghe gui du lieu tu server ve client theo thoi gian thuc, chi mot chieu (server -> client).

```
Client                           Server
  |                                |
  |------- GET /chat/stream ------>|
  |                                |
  |<---- data: {"Xin"} -----------| (text event stream)
  |<---- data: {"Xin chao"} ------|
  |<---- data: {"Xin chao, toi"} -|
  |                                |
  |<---- data: [DONE] -------------|
```

### 14.3. Streaming API trong Spring

```java
@PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<String> chatStream(@RequestBody ChatRequest request) {
    // Tra ve Flux<String> - stream cua strings
    return chatClient.prompt()
            .system(systemPrompt)
            .user(request.getMessage())
            .stream()
            .content();
}
```

**Luu y:**
- `produces = MediaType.TEXT_EVENT_STREAM_VALUE` — bao server tra ve SSE
- `Flux<T>` — Reactive Streams, stream cua cac phan tu
- `.stream()` thay vi `.call()` — tra ve stream thay vi cau tra loi day du

### 14.4. Streaming trong AIChatService

```java
public StreamingChatResponse chatStreaming(ChatRequest request, Long userId) {
    // Tim context
    List<SearchResult> searchResults = searchContext(request);
    String context = vectorSearchService.buildContext(searchResults);
    String systemPrompt = buildSystemPrompt(context);

    // Tra ve Flux de stream
    Flux<String> stream = chatClient.prompt()
            .system(systemPrompt)
            .user(request.getMessage())
            .stream()
            .content();

    return new StreamingChatResponse(sessionId, stream, sources);
}

// Record class cho response
public record StreamingChatResponse(
    String sessionId,
    Flux<String> stream,
    List<String> sources
) {}
```

### 14.5. Few-shot Examples trong Prompt

Few-shot examples giup AI hieu cach tra loi dung:

```java
private String buildSystemPrompt(String context) {
    StringBuilder prompt = new StringBuilder();

    prompt.append("Ban la tro ly AI cua CuongHoangDev Portfolio.\n\n");

    // Few-shot examples
    prompt.append("## Vi du cach tra loi:\n\n");
    prompt.append("**Cau hoi:** Ky nang Java cua ban nhu the nao?\n");
    prompt.append("**Tra loi:** CuongHoangDev co 5 nam kinh nghiem voi Java. ⭐⭐⭐⭐⭐\n\n");

    prompt.append("**Cau hoi:** Ban da lam du an gi?\n");
    prompt.append("**Tra loi:** CuongHoangDev da thuc hien nhieu du an, bao gom:\n");
    prompt.append("1. Portfolio V2 - He thong portfolio voi AI chatbot\n");
    prompt.append("2. E-Commerce Platform - Nen tang thuong mai dien tu\n\n");

    // Context
    if (context != null && !context.isEmpty()) {
        prompt.append("## Thong tin tu tai lieu:\n\n");
        prompt.append(context);
    }

    // Quy tac
    prompt.append("\n## Quy tac tra loi:\n");
    prompt.append("- Tra loi bang tieng Viet\n");
    prompt.append("- Su dung emoji phu hop\n");
    prompt.append("- Danh dau level bang ⭐ (1-5)\n");

    return prompt.toString();
}
```

### 14.6. Bang Feedback va Analytics

```sql
-- Bang feedback
CREATE TABLE chat_feedback (
    id              BIGSERIAL PRIMARY KEY,
    message_id      BIGINT NOT NULL REFERENCES chat_messages(id),
    user_id         BIGINT REFERENCES users(id),
    rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_type   VARCHAR(20) NOT NULL,  -- helpful, not_helpful
    comment         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bang analytics
CREATE TABLE chat_analytics (
    id              BIGSERIAL PRIMARY KEY,
    session_id      VARCHAR(100) NOT NULL,
    date            DATE NOT NULL,
    message_count   INT DEFAULT 0,
    avg_response_time_ms INT DEFAULT 0,
    tokens_used     INT DEFAULT 0,
    UNIQUE(session_id, date)
);

-- Bang AI prompts
CREATE TABLE ai_prompts (
    id              BIGSERIAL PRIMARY KEY,
    prompt_key     VARCHAR(100) NOT NULL UNIQUE,
    prompt_template TEXT NOT NULL,
    is_active      BOOLEAN DEFAULT TRUE
);
```

### 14.7. Feedback API

```java
// POST /api/v1/ai/feedback
@PostMapping("/feedback")
public ResponseEntity<ApiResponse<ChatFeedback>> submitFeedback(
        @Valid @RequestBody FeedbackRequest request) {

    ChatFeedback feedback = chatAnalyticsService.submitFeedback(request, userId);
    return ResponseEntity.ok(ApiResponse.ok("Cam on ban da gui feedback!", feedback));
}

// Request DTO
public class FeedbackRequest {
    @NotNull private Long messageId;
    @Min(1) @Max(5) private Integer rating;
    @NotBlank private String feedbackType;  // helpful, not_helpful
    private String comment;
}
```

### 14.8. Analytics Service

```java
@Service
public class ChatAnalyticsService {

    public Map<String, Object> getOverviewStats() {
        Map<String, Object> stats = new HashMap<>();

        // Messages hom nay
        stats.put("todayMessages", getTodayMessages());

        // Messages tuan nay
        stats.put("weekMessages", getWeekMessages());

        // Average response time
        stats.put("avgResponseTimeMs", getAvgResponseTime());

        // Feedback stats
        stats.put("avgRating", getAverageRating());

        return stats;
    }
}
```

### 14.9. API Endpoints Tong Hop

```
CHAT:
  POST /api/v1/ai/chat                  ← Chat binh thuong
  POST /api/v1/ai/chat/stream          ← Chat streaming (SSE)
  GET  /api/v1/ai/chat/history/{id}  ← Lich su chat
  GET  /api/v1/ai/chat/sessions       ← Danh sach sessions
  DELETE /api/v1/ai/chat/sessions/{id} ← Xoa session

FEEDBACK:
  POST /api/v1/ai/feedback             ← Gui feedback
  GET  /api/v1/ai/feedback/stats      ← Thong ke feedback

ANALYTICS:
  GET  /api/v1/ai/analytics/overview ← Tong quan

ADMIN:
  POST /api/v1/ai/admin/knowledge/index-all
  POST /api/v1/ai/admin/documents
  GET  /api/v1/ai/admin/stats
```

### 14.10. Loi thuong gap voi Streaming

| Loi | Nguyen nhan | Cach fix |
|-----|-------------|----------|
| `MediaType` error | Chua set `produces` | `produces = MediaType.TEXT_EVENT_STREAM_VALUE` |
| Stream bi cut | Connection reset | Tang timeout hoac dung proxy |
| Memory leak | Quen dong Flux | Khong can, Spring tu quan ly |
| CORS issue | SSE CORS | Cau hinh `allowedHeaders` bao gom Accept |

### 14.11. Client Side (Frontend)

```javascript
// Fetch API voi streaming
const response = await fetch('/api/v1/ai/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '...' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  // Parse SSE: "data: content\n\n"
  text.split('\n').forEach(line => {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      // Hien thi text
      displayText(data);
    }
  });
}
```

---

## NGÀY 15 — Frontend Next.js Setup

### 15.1. Tai sao Next.js?

Next.js la React framework voi nhieu uu diem:
```
So sanh React vs Next.js:
React (Create React App):
  - Chi la UI library
  - Phai cau hinh tay nhieu thu
  - Router rieng biet
  - SEO khong tot

Next.js:
  - Full-stack framework
  - App Router / Server Components
  - API Routes tich hop
  - SEO tu dong (SSR)
  - Tu dong code splitting
```

### 15.2. Cau truc Project

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 14+)
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── components/            # Reusable components
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities, API
│   ├── store/                 # Zustand stores
│   └── types/                 # TypeScript types
├── public/                    # Static files
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

### 15.3. TypeScript Types

```typescript
// src/types/index.ts

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface ChatMessage {
  id: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
```

### 15.4. API Client (Axios)

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 30000,
});

// Request interceptor - them token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - xu ly loi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/api/v1/auth/login', data),
  register: (data: any) => api.post('/api/v1/auth/register', data),
};

// Blog API
export const blogApi = {
  getPosts: (params?: any) => api.get('/api/v1/blog/posts', { params }),
  getCategories: () => api.get('/api/v1/blog/categories'),
};

// AI Chat API
export const aiApi = {
  chat: (data: { message: string; sessionId?: string }) =>
    api.post('/api/v1/ai/chat', data),
};

export default api;
```

### 15.5. Zustand Store

Zustand la state management nhe, de su dung hon Redux:

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

### 15.6. Tailwind CSS

```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
};
```

### 15.7. Lenh cu phap

```bash
# Khoi tao project
npx create-next-app@latest frontend --typescript --tailwind --app

# Chay dev server
cd frontend
npm run dev

# Build production
npm run build

# Xem truoc production
npm run start
```

### 15.8. Next.js App Router

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="min-h-screen">
      <h1>Welcome to CuongHoangDev Portfolio</h1>
    </main>
  );
}
```

---

## CAC BƯỚC TIẾP THEO

### Ngày 16: Components & UI Kit

- Button, Input, Card components
- Layout components (Header, Footer, Sidebar)
- Form components

### Ngày 17: Page Layouts & Navigation

- Header với navigation
- Homepage layout
- Responsive design

### Ngày 18-21: Pages Implementation

- Blog pages
- AI Chatbot UI
- Admin Dashboard

### Checklist:

- [ ] `npm install` trong thu muc frontend
- [ ] Kiem tra `NEXT_PUBLIC_API_URL` trong .env.local
- [ ] Test ket noi API
