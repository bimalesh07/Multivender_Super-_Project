# 🎯 Multi-Vendor E-Commerce — Backend Interview Preparation Guide

> **Project**: Multi-Vendor E-Commerce Platform  
> **Tech Stack**: Django 6.0.1, Django REST Framework (DRF), PostgreSQL, Docker, PyJWT, Pillow  
> **Architecture**: RESTful API with Role-Based Access Control (RBAC)

---

## 📌 TABLE OF CONTENTS

1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Technology Choices — Kyu Use Kiya?](#2-technology-choices--kyu-use-kiya)
3. [App-by-App Deep Dive](#3-app-by-app-deep-dive)
4. [Interview Questions & Answers (Hindi + English)](#4-interview-questions--answers)
5. [Advanced Concepts Used](#5-advanced-concepts-used)
6. [API Endpoints Summary](#6-api-endpoints-summary)
7. [Database Design & Relationships](#7-database-design--relationships)
8. [Security Measures](#8-security-measures)
9. [Common Follow-Up Questions](#9-common-follow-up-questions)

---

## 1. Project Overview & Architecture

### Project Structure:
```
Multi_vender Project/
├── core/             → Main Django project settings, URLs, middleware
├── accounts/         → User registration, login, JWT authentication
├── organizations/    → Multi-vendor organization management
├── products/         → Product CRUD, approval workflow, search
├── Cart/             → Shopping cart management
├── orders/           → Order placement, history, admin management
├── wishlist/         → Customer wishlist
├── address/          → Customer shipping addresses
├── frontend/         → Frontend (Vite + React likely)
├── docker-compose.yml → PostgreSQL Docker container
├── requirements.txt  → Python dependencies
└── manage.py         → Django management script
```

### Role Hierarchy (RBAC):
```
SUPERUSER → Creates Organizations + Admins
    └── ADMIN → Manages Products, Staff, Orders (per Organization)
         └── STAFF → Creates/Edits Products (per Organization)
              └── CUSTOMER → Browses, Carts, Orders, Wishlist
```

---

## 2. Technology Choices — Kyu Use Kiya?

### 🔷 Django 6.0.1 — Kyu Use Kiya?
**Answer**: Django isliye choose kiya kyunki:
- **Batteries-included framework** hai — ORM, admin panel, auth, middleware sab built-in milta hai
- **Rapid development** — kam time mein complete backend ban jaata hai
- **Security** — CSRF protection, SQL injection prevention, XSS protection by default
- **ORM** — Raw SQL likhne ki zarurat nahi, models se database automatically manage hota hai

**Kyu nahi Flask?**  
Flask micro-framework hai, usme sab kuch manually setup karna padta — ORM, admin, auth. Multi-vendor jaise complex project mein Django better hai kyunki sab built-in milta hai.

**Kyu nahi FastAPI?**  
FastAPI async ke liye achha hai, lekin Django ka ecosystem zyada mature hai — admin panel, ORM, middleware system. Hamare project mein async ki zarurat nahi thi.

**Kyu nahi Express.js (Node.js)?**
Django ka ORM aur admin panel bahut powerful hai. Python ecosystem mein data handling aur backend logic likhna easier hai. Plus Django ka security by-default bahut strong hai.

---

### 🔷 Django REST Framework (DRF) — Kyu Use Kiya?
**Answer**: DRF isliye use kiya kyunki:
- **Serializers** — Data validation aur JSON conversion automatically handle hota hai
- **APIView** — Clean, class-based views milte hain
- **Browsable API** — Development mein test karna easy hota hai
- **Parsers** — JSON, MultiPart (file upload), FormData sab handle karta hai

**Kyu nahi Django ka default views?**  
Django ka default views HTML return karta hai. Hamare project mein frontend alag hai (React/Vite), toh hume JSON APIs chahiye thi — DRF perfectly JSON APIs banata hai.

**Settings mein kya configure kiya:**
```python
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',  # File uploads ke liye
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/minute',
        'user': '60/minute',
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```
- **JSONRenderer only** use kiya — kyunki hum sirf JSON API bana rahe hain, HTML template nahi chahiye
- **MultiPartParser** isliye add kiya kyunki product images upload hoti hain

---

### 🔷 PostgreSQL — Kyu Use Kiya (SQLite kyu nahi)?
**Answer**:
- **Production-grade database** hai — SQLite development ke liye hai, production ke liye nahi
- **Concurrent access** support karta hai — multiple users ek sath access kar sakte hain
- **UUID support** — Hamare project mein UUIDs primary keys hain, PostgreSQL natively support karta hai
- **ACID compliance** — Transactions properly handle hoti hain (orders mein `transaction.atomic()` use kiya hai)
- **Advanced features** — Full-text search, JSON fields, array fields support karta hai

**SQLite kyu nahi?**  
SQLite file-based hai, concurrent writes mein lock ho jaata hai. Multi-vendor platform pe multiple admins/customers simultaneously kaam karte hain — SQLite handle nahi kar paata.

**MySQL kyu nahi?**  
PostgreSQL ka UUID support, JSON support, aur overall feature set MySQL se better hai. Plus Django community mein PostgreSQL zyada recommended hai.

---

### 🔷 Docker — Kyu Use Kiya?
**Answer**: PostgreSQL ke liye Docker use kiya:
```yaml
services:
  postgres:
    image: postgres:15
    container_name: multivendor_postgres
    env_file:
      - .env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
```
- **Environment consistency** — Har developer ka same PostgreSQL version hoga
- **Easy setup** — `docker-compose up` se database ready ho jaata hai
- **Volume persistence** — Data container restart ke baad bhi safe rehta hai
- **Isolation** — System ke PostgreSQL se conflict nahi hota

---

### 🔷 PyJWT (Manual JWT) — Kyu Use Kiya (SimpleJWT kyu nahi)?
**Answer**: Manually JWT implement kiya `PyJWT` library se kyunki:
- **Full control** — Token payload mein exactly wahi data daala jo chahiye tha (`user_id`, `role`)
- **Learning purpose** — JWT kaisa kaam karta hai wo deeply samajh aaya
- **Lightweight** — SimpleJWT ke unnecessary features nahi chahiye the
- **Custom middleware** — Apna JWT middleware banaya jo har request pe token check karta hai

**SimpleJWT kyu nahi?**  
SimpleJWT bada package hai with access/refresh tokens, token blacklisting etc. Hamare project mein itna complex JWT nahi chahiye tha. Manual implementation se JWT ka internals samajh aaya.

**JWT Flow:**
```
1. User Login → Server generates JWT token (24 hours expiry)
2. Frontend stores token → Sends in "Authorization: Bearer <token>" header
3. Middleware reads token → Decodes → Attaches user to request.auth_user
4. Views check request.auth_user for authorization
```

---

### 🔷 python-dotenv — Kyu Use Kiya?
**Answer**: Environment variables ko `.env` file se load karne ke liye:
- **Security** — Database passwords, secret keys code mein hardcode nahi karte
- **Environment separation** — Development aur production ke alag `.env` files ho sakte hain
- **Git safety** — `.env` file `.gitignore` mein hoti hai, toh credentials GitHub pe nahi jaate

---

### 🔷 django-cors-headers — Kyu Use Kiya?
**Answer**: Frontend (Vite on `localhost:5173`) aur Backend (Django on `localhost:8000`) alag ports pe hain:
- **CORS (Cross-Origin Resource Sharing)** — Browser by default cross-origin requests block karta hai
- **cors-headers** middleware se specific origins allow kiye:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',    # Vite dev server
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True  # Cookies/auth headers allow karne ke liye
```

---

### 🔷 Pillow — Kyu Use Kiya?
**Answer**: Product images handle karne ke liye:
- Django ka `ImageField` internally Pillow use karta hai
- Image validation (valid image hai ya nahi) Pillow karta hai
- Product thumbnails aur gallery images upload hoti hain

---

### 🔷 UUID — Primary Keys mein kyu use kiya (Auto-increment kyu nahi)?
**Answer**:
- **Security** — Auto-increment IDs predictable hote hain (1, 2, 3...) — attacker next ID guess kar sakta hai
- **Scalability** — Multiple databases merge karne mein UUID clash nahi hota
- **Privacy** — Customer ko order count ya user count guess nahi hoga
- **API clarity** — `/api/v1/products/abc123-uuid/` zyada professional lagta hai

---

## 3. App-by-App Deep Dive

### 📁 `accounts/` — Authentication System

#### Models (`models.py`):
```python
class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # Hashed password stored
    role = models.CharField(choices=ROLE_CHOICES)  # SUPERUSER/ADMIN/STAFF/CUSTOMER
    organization = models.ForeignKey("organizations.Organization", null=True)
```

**🎤 Interview Question: Django ka built-in User model kyu nahi use kiya?**  
**Answer**: Custom User model isliye banaya kyunki:
- Hume `role` field chahiye tha — Django ka default User mein nahi hota
- `organization` FK chahiye tha — Multi-vendor ke liye
- `email` as primary login — Django default mein `username` hota hai
- `UUID` as primary key — Django default mein integer auto-increment hota hai
- **Lekin** `AbstractUser` extend bhi kar sakte the — production mein wo better approach hota kyunki Django ka auth system (permissions, groups, is_staff) use kar paate

---

#### JWT Authentication (`jwt.py`):
```python
def generate_jwt(user):
    payload = {
        "user_id": str(user.id),
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=24),  # 24 hour expiry
        "iat": datetime.utcnow()  # Issued at
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
```

**🎤 Interview Q: HS256 algorithm kya hai? Koi aur kyu nahi use kiya?**  
**Answer**: 
- **HS256 = HMAC-SHA256** — Symmetric algorithm hai, ek hi secret key se sign aur verify hota hai
- Use kiya kyunki **single server** hai — same server token banata aur verify karta hai
- **RS256** (asymmetric) tab use karte jab **multiple services** hoti hain — public key se verify, private key se sign. Microservices mein RS256 better hota

---

#### JWT Middleware (`middleware.py`):
```python
class JWTAuthenticationMiddleware:
    def __call__(self, request):
        request.auth_user = None  # Default: no user
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_jwt(token)
            if payload:
                user = User.objects.get(id=payload["user_id"])
                request.auth_user = user
        return self.get_response(request)
```

**🎤 Interview Q: Middleware kya hai? DRF permissions kyu nahi use kiye?**  
**Answer**: 
- **Middleware** har request ko intercept karta hai — view tak pahuchne se pehle
- Middleware se `request.auth_user` set kiya — toh har view mein user available rehta hai
- DRF permissions (`IsAuthenticated`) bhi use kar sakte the, lekin custom middleware se **flexible control** mila — admin panel ke liye skip kiya, API ke liye apply kiya
- **Order of middleware matters**: CORS middleware sabse pehle rakha, JWT middleware baad mein

**🎤 Interview Q: Admin panel ke liye middleware bypass kyu kiya?**  
```python
if request.path.startswith("/admin"):
    return self.get_response(request)
```
**Answer**: Django Admin panel session-based auth use karta hai, JWT nahi. Agar middleware admin requests pe bhi JWT check karta toh admin panel kaam nahi karta.

---

#### Password Hashing (`utils.py`):
```python
from django.contrib.auth.hashers import make_password, check_password

def hash_password(raw_password):
    return make_password(raw_password)  # Uses PBKDF2 by default
```

**🎤 Interview Q: Password plain text mein store kyu nahi kiya? kya hashing algorithm use kiya?**  
**Answer**: 
- Plain text mein store karna **security risk** hai — database leak hone pe sab passwords expose ho jayenge
- Django ka `make_password()` internally **PBKDF2-SHA256** use karta hai with salt
- **PBKDF2** slow hashing hai — brute force attack ko slow karta hai
- **bcrypt** bhi use kar sakte the — wo bhi similarly secure hai, lekin Django ka default PBKDF2 tha toh wahi use kiya

---

### 📁 `organizations/` — Multi-Vendor System

**🎤 Interview Q: Multi-vendor architecture kaise implement kiya?**  
**Answer**:
1. **Organization model** banaya — har vendor ek organization hai
2. **User model mein FK** — Admin aur Staff organization se linked hain
3. **Product model mein FK** — Har product ek organization ka hota hai
4. **Data isolation** — Admin sirf apni organization ke products dekh sakta hai:
```python
products = Product.objects.filter(organization=user.organization)
```
5. **SUPERUSER** overall system manage karta hai — organizations create karta hai with admin

**🎤 Interview Q: Organization create karte waqt admin bhi kyu banate ho?**  
**Answer**: Kyunki organization bina admin ke bekar hai. Ek atomic operation mein dono create karte hain — organization bhi aur uska admin bhi. Admin fir apne staff members create kar sakta hai.

---

### 📁 `products/` — Product Management

#### Model Design:
```python
class Product(models.Model):
    # Identity
    id = models.UUIDField(primary_key=True)
    sku = models.CharField(unique=True)       # Stock Keeping Unit
    name, description, thumbnail, manufacturer, material, product_type
    
    # Pricing
    price = models.DecimalField()             # Original price
    discount_price = models.DecimalField()     # Discounted price
    
    # Inventory
    stock = models.PositiveIntegerField()     # Available quantity
    is_in_stock = models.BooleanField()       # Auto-calculated
    
    # Status
    is_active = models.BooleanField()         # Soft delete
    is_approved = models.BooleanField()       # Admin approval needed
    
    # Relationships
    organization = models.ForeignKey(Organization)
    created_by = models.ForeignKey(User)
```

**🎤 Interview Q: `DecimalField` kyu use kiya `FloatField` nahi?**  
**Answer**: 
- **FloatField** mein precision issues hoti hain — `0.1 + 0.2 = 0.30000000000000004`
- **DecimalField** exact decimal arithmetic deta hai — financial calculations ke liye mandatory hai
- Paison mein 1 paisa ka bhi error nahi chahiye — isliye DecimalField use kiya

**🎤 Interview Q: `is_in_stock` field alag kyu rakhte ho jab `stock > 0` se pata chal jaata hai?**  
**Answer**: 
- **Database optimization** — Query mein `WHERE is_in_stock=True` directly index se fast milta hai bina calculation ke
- **save() method mein auto-update** hota hai: `self.is_in_stock = self.stock > 0`
- Isse hume har query mein stock > 0 check nahi karna padta

**🎤 Interview Q: Product approval workflow kya hai?**  
**Answer**:
1. Staff/Admin product create karta hai → `is_approved = False` (default)
2. Admin product approve karta hai → `is_approved = True`
3. Agar product edit hota hai → `is_approved = False` (re-approval chahiye)
4. Public APIs sirf `is_approved=True, is_active=True` products dikhate hain

**🎤 Interview Q: `@property current_price` kya karta hai?**  
```python
@property
def current_price(self):
    if self.discount_price and self.discount_price < self.price:
        return self.discount_price
    return self.price
```
**Answer**: Smart pricing logic — agar discount price hai aur wo original price se kam hai toh discount price return karta hai, warna original price. Cart aur Order mein yahi use hota hai.

**🎤 Interview Q: Custom `save()` method mein kya kiya?**  
**Answer**:
- Stock 0 hone pe automatically `is_in_stock = False` set hota hai
- Discount price >= Original price hone pe `ValidationError` raise hota hai
- Ye **Model-level validation** hai — koi bhi code product save kare, ye check hamesha chalega

---

#### ProductImage Model:
```python
class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images')
    image = models.ImageField(upload_to='products/gallery/')
    is_feature = models.BooleanField(default=False)
```

**🎤 Interview Q: Product images alag model mein kyu rakhte hain?**  
**Answer**: 
- Ek product ke **multiple images** ho sakte hain — Gallery feature ke liye
- `related_name='images'` se `product.images.all()` se sab images mil jaate hain
- `is_feature` flag se ek main image mark kar sakte hain
- **Normalization** — Product table clean rehti hai, images alag table mein hoti hain

---

#### Product Views:

**🎤 Interview Q: Search kaise implement kiya?**  
```python
products = products.filter(
    Q(name__icontains=search_query) | Q(description__icontains=search_query)
)
```
**Answer**: 
- **Q objects** use kiye — OR condition ke liye
- `__icontains` — Case-insensitive partial match
- Name ya description mein search query ho toh product milega
- **Better alternative**: PostgreSQL Full-Text Search (`SearchVector`) — more relevant results, ranking support

**🎤 Interview Q: Product detail mein `prefetch_related` kyu use kiya?**  
```python
Product.objects.prefetch_related('images').get(id=product_id)
```
**Answer**: 
- `prefetch_related` se **N+1 problem** solve hota hai
- Bina iske agar 10 products ke images fetch karte toh 1 (products) + 10 (images) = 11 queries lagti
- `prefetch_related` se sirf 2 queries lagti hain — 1 products ki, 1 images ki

---

### 📁 `Cart/` — Shopping Cart System

**🎤 Interview Q: Cart ka OneToOneField kyu use kiya?**  
```python
user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
```
**Answer**: 
- Ek user ka **sirf ek hi cart** ho sakta hai — business logic ke hisaab se
- `OneToOneField` database level pe enforce karta hai — duplicate carts nahi bann sakti
- `related_name='cart'` se `user.cart` se directly access milta hai

**🎤 Interview Q: CartItem mein `SET_NULL` kyu use kiya `CASCADE` nahi?**  
```python
product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
```
**Answer**:
- Agar product delete ho jaaye toh cart item delete nahi hoga — sirf product=null ho jayega
- Frontend pe **"Product no longer available"** message dikha sakte hain
- `CASCADE` karte toh product delete hone pe cart item bhi delete ho jaata — customer ko pata bhi nahi chalta

**🎤 Interview Q: Cart serializer mein `select_related` kyu use kiya?**  
```python
items = cart.items.select_related('product').all()
```
**Answer**: 
- **N+1 Problem** avoid kiya — ForeignKey ke data ke liye extra queries nahi lagti
- `select_related` **JOIN query** banata hai — 1 hi query mein CartItem + Product data aa jaata hai
- `prefetch_related` ManyToMany/reverse FK ke liye better hai, `select_related` ForeignKey ke liye

**🎤 Interview Q: Stock validation cart mein kaise handle kiya?**  
**Answer**: Cart serializer mein **future quantity** calculate karke check kiya:
```python
# Pehle se cart mein kitna hai + naya add kiya
future_quantity = existing_item.quantity + new_quantity
if future_quantity > product.stock:
    raise ValidationError("Insufficient stock")
```
Ye ensure karta hai ki customer stock se zyada add nahi kar sake.

---

### 📁 `orders/` — Order Management

**🎤 Interview Q: `transaction.atomic()` kyu use kiya?**  
```python
with transaction.atomic():
    order = Order.objects.create(...)
    for item in cart_items:
        product.stock -= item.quantity
        product.save()
        OrderItem.objects.create(...)
    cart.items.all().delete()
```
**Answer**:
- **Atomicity** — Ya toh sab kuch hoga, ya kuch nahi hoga
- Agar stock deduct ho gaya lekin order save mein error aaya → stock wapas restore ho jayega (rollback)
- Bina atomic ke partial data save ho sakta hai — customer ka stock kat jaata lekin order nahi banta
- **Real-world scenario**: Agar beech mein server crash ho jaaye toh data inconsistent nahi hoga

**🎤 Interview Q: `select_for_update()` kyu use kiya?**  
```python
cart_items = cart.items.select_related('product').filter(...).select_for_update()
```
**Answer**:
- **Row-level locking** — Jab ek customer order place kar raha hai, tab koi aur uska same product ka stock change nahi kar sakta
- **Race condition prevent** karta hai — 2 customers simultaneously same last item buy karne ki koshish karein toh ek ko error milega
- Ye sirf `transaction.atomic()` ke andar kaam karta hai

**🎤 Interview Q: OrderItem mein price snapshot kyu save kiya?**  
```python
class OrderItem(models.Model):
    product_name = models.CharField()    # Snapshot
    product_sku = models.CharField()     # Snapshot
    price = models.DecimalField()        # Price AT MOMENT of purchase
```
**Answer**:
- Product ki price **change ho sakti hai baad mein** — lekin order history mein original price dikhni chahiye
- Agar product **delete** bhi ho jaaye toh order mein name aur price preserved rehega
- Ye **data integrity** ka standard e-commerce pattern hai — Amazon bhi yahi karta hai

**🎤 Interview Q: Order cancel karne pe stock kaise restore hota hai?**  
```python
with transaction.atomic():
    for item in order.items.all():
        if item.product:
            item.product.stock += item.quantity
            item.product.save()
    order.status = 'CANCELLED'
    order.save()
```
**Answer**: Atomic transaction mein har item ka stock wapas add hota hai. `if item.product` check isliye hai kyunki product delete ho sakta hai — uss case mein stock restore nahi hoga (product hi nahi hai).

**🎤 Interview Q: `current_price` property order mein kaise use hoti hai?**  
```python
price_at_purchase = product.current_price  # Discount price if available
```
**Answer**: `current_price` property discount price return karti hai agar available hai, warna original price. Order placement ke waqt yahi price snapshot hota hai — customer ko actual paid price dikhta hai.

---

### 📁 `address/` — Address Management

**🎤 Interview Q: Default address logic kaise handle kiya?**  
```python
def save(self, *args, **kwargs):
    if self.is_default:
        Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
    super().save(*args, **kwargs)
```
**Answer**: 
- Jab koi address default set hota hai → pehle us user ke sab purane default addresses un-default ho jaate hain
- **Model-level logic** hai — chahe admin panel se save karo ya API se, ye hamesha chalega
- Isse **sirf ek** address default rehta hai per user

**🎤 Interview Q: Address ordering kaise kiya?**  
```python
class Meta:
    ordering = ['-is_default', '-created_at']
```
**Answer**: Default address hamesha sabse pehle aayega, fir latest addresses. User ko sabse relevant address pehle dikhta hai.

**🎤 Interview Q: Phone number validation kaise kiya?**  
```python
def validate_phone_number(self, value):
    if not value.isdigit():
        raise ValidationError("Phone number must contain only digits.")
    if len(value) < 10 or len(value) > 15:
        raise ValidationError("Phone number must be between 10 and 15 digits.")
```
**Answer**: **Serializer-level validation** — sirf digits allow hain, 10-15 digits ke beech hona chahiye. Ye international phone numbers support karta hai.

---

### 📁 `wishlist/` — Wishlist System

**🎤 Interview Q: `unique_together` kyu use kiya?**  
```python
class Meta:
    unique_together = ('wishlist', 'product')
```
**Answer**: 
- Ek user ek product ko **sirf ek baar** wishlist mein add kar sakta hai
- Database level pe constraint hai — koi bhi code se duplicate entry nahi ho sakti
- Application level pe bhi check hai — `get_or_create` use kiya

**🎤 Interview Q: Wishlist mein `get_or_create` kyu use kiya?**  
**Answer**: 
- Pehli baar wishlist create hoti hai, baad mein get hoti hai
- Ek hi method se dono kaam ho jaata hai — extra if-else nahi likhna padta
- **Idempotent** — same request multiple baar bhejo toh bhi ek hi wishlist rehti hai

---

## 4. Interview Questions & Answers

### 🔷 General Architecture Questions

**Q: API versioning (`/api/v1/`) kyu use kiya?**  
**A**: Future mein agar API change karna ho (`v2`), toh purane clients break nahi honge. Old clients `v1` use karenge, naye clients `v2`. Ye backward compatibility maintain karta hai.

**Q: Class-Based Views (APIView) kyu use kiye Function-Based nahi?**  
**A**: 
- **Code organization** — GET, POST, PUT, DELETE ek hi class mein
- **Reusability** — Common logic inherit kar sakte hain
- **Readability** — Kaunsa HTTP method kya karta hai clearly dikh jaata hai
- Django REST Framework mein APIView standard approach hai

**Q: `serializers.Serializer` aur `serializers.ModelSerializer` mein kya fark hai?**  
**A**:
- `Serializer` — Manually fields define karte hain, full control hota hai
- `ModelSerializer` — Model se automatically fields generate hote hain, kam code likhna padta hai
- Hamare project mein dono use kiye — registration ke liye manual (kyunki model se directly nahi map hota), products ke liye ModelSerializer (direct model mapping)

---

### 🔷 Security Questions

**Q: CSRF middleware kyu use kiya agar JWT use kar rahe ho?**  
**A**: Django ka default CSRF middleware hai — hataya nahi kyunki admin panel session-based hai aur usme CSRF chahiye. API requests mein JWT se auth hoti hai, CSRF header ki zarurat nahi — lekin admin panel ke liye CSRF active hai.

**Q: `SECRET_KEY` hardcoded hai — production mein kya karoge?**  
**A**: Production mein `SECRET_KEY` ko `.env` file mein rakhenge ya environment variable se load karenge:
```python
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
```
Abhi development mein hardcoded hai — production mein ye **bahut bada security risk** hai.

**Q: JWT token mein role kyu store kiya?**  
**A**: Har request pe database se user ka role fetch karne ki zarurat nahi — token se directly pata chal jaata hai. Lekin **middleware mein database se user fetch karte hain** — toh updated role milta hai.

---

### 🔷 Database & ORM Questions

**Q: `on_delete=models.SET_NULL` aur `on_delete=models.CASCADE` mein kya fark hai?**  
**A**:
- `CASCADE` — Parent delete hone pe child bhi delete ho jayega
  - Example: User delete → Orders delete (user ke saare orders udd jayenge)
- `SET_NULL` — Parent delete hone pe child mein FK null ho jayega
  - Example: Product delete → CartItem mein product=null (item rehta hai, product nahi)
  - Example: Organization delete → User mein organization=null

**Q: `related_name` kya karta hai?**  
**A**: Reverse relationship ka naam set karta hai:
```python
# Model mein:
organization = models.ForeignKey(Organization, related_name='products')

# Use mein:
organization.products.all()  # Organization ke saare products
```
Bina `related_name` ke Django default naam deta hai: `organization.product_set.all()` — jo readable nahi hai.

**Q: `auto_now_add` aur `auto_now` mein kya fark hai?**  
**A**:
- `auto_now_add=True` → Sirf pehli baar save hone pe timestamp set hota hai (created_at)
- `auto_now=True` → Har baar save hone pe timestamp update hota hai (updated_at)

---

### 🔷 Performance Questions

**Q: N+1 problem kya hai aur kaise solve kiya?**  
**A**:
- **N+1 Problem**: Agar 10 cart items fetch kiye, aur har item ka product bhi chahiye — toh 1 (cart items) + 10 (products) = 11 queries
- **Solution**: 
  - `select_related('product')` — ForeignKey ke liye, SQL JOIN banta hai → 1 query
  - `prefetch_related('images')` — Many-to-Many/Reverse FK ke liye → 2 queries (items + images)
- Hamare project mein **Cart, Orders, Products** mein use kiya hai

**Q: Database indexing kaha use ki?**  
**A**:
- `unique=True` automatically index create karta hai — `email`, `sku`
- `primary_key=True` (UUID) bhi indexed hota hai
- ForeignKey fields automatically indexed hoti hain
- `ordering` mein use hone wale fields pe bhi implicit index hota hai

---

## 5. Advanced Concepts Used

| Concept | Kaha Use Kiya | Kyu Use Kiya |
|---------|--------------|--------------|
| UUID Primary Keys | Sab models mein | Security, scalability |
| JWT Authentication | accounts/jwt.py | Stateless auth, no session needed |
| Custom Middleware | accounts/middleware.py | Global auth check |
| Atomic Transactions | orders/serializers.py | Data consistency |
| Row-Level Locking | select_for_update() | Race condition prevention |
| N+1 Optimization | select_related, prefetch_related | Performance |
| Price Snapshots | OrderItem model | Data integrity |
| Soft Delete | is_active flag | Data preservation |
| Approval Workflow | is_approved flag | Quality control |
| Model-Level Validation | Product.save(), Address.save() | Business logic enforcement |
| API Error Middleware | core/api_middleware.py | Consistent JSON error responses |
| CORS Configuration | django-cors-headers | Frontend-Backend communication |
| Q Objects | Product search | OR conditions in queries |
| get_or_create | Cart, Wishlist | Idempotent operations |
| unique_together | WishlistItem | Database-level duplicate prevention |
| Pagination | DRF PageNumberPagination | Large dataset handling, 10 items/page |
| Rate Limiting | DRF Throttling | API abuse prevention (20/60 req/min) |
| Structured Logging | Python logging + RotatingFileHandler | Debugging, monitoring, error tracking |
| Swagger API Docs | drf-spectacular | Auto-generated OpenAPI documentation |

---

## 6. API Endpoints Summary

### Accounts
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/accounts/register/` | Public | Customer registration |
| POST | `/api/v1/accounts/login/` | Public | Login, returns JWT |
| POST | `/api/v1/accounts/create-staff/` | Admin | Create staff member |
| GET | `/api/v1/accounts/profile/` | Authenticated | View profile |

### Organizations
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/organizations/create/` | Superuser | Create org + admin |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/products/public/` | Public | List approved products |
| GET | `/api/v1/products/public/<id>/` | Public | Product detail |
| GET | `/api/v1/products/public/<id>/related/` | Public | Related products |
| POST | `/api/v1/products/create/` | Admin/Staff | Create product |
| POST | `/api/v1/products/approve/<id>/` | Admin | Approve product |
| GET | `/api/v1/products/admin-list/` | Admin/Staff | Org products list |
| PATCH | `/api/v1/products/edit/<id>/` | Admin/Staff | Edit product |
| DELETE | `/api/v1/products/delete/<id>/` | Admin | Delete product |

### Cart
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/cart/add/` | Customer | Add to cart |
| GET | `/api/v1/cart/view/` | Customer | View cart |
| PATCH | `/api/v1/cart/item/<id>/` | Customer | Update quantity |
| DELETE | `/api/v1/cart/item/<id>/` | Customer | Remove from cart |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/orders/place/` | Customer | Place order from cart |
| GET | `/api/v1/orders/history/` | Customer | Order history |
| GET | `/api/v1/orders/admin/list/` | Admin/Staff | All orders |
| PATCH | `/api/v1/orders/admin/update-status/<id>/` | Admin/Staff | Update order status |

### Wishlist
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/wishlist/add/` | Customer | Add to wishlist |
| GET | `/api/v1/wishlist/view/` | Customer | View wishlist |
| DELETE | `/api/v1/wishlist/remove/<id>/` | Customer | Remove from wishlist |

### Address
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/address/create/` | Customer | List addresses |
| POST | `/api/v1/address/create/` | Customer | Create address |
| GET | `/api/v1/address/<id>/` | Customer | Get single address |
| PUT | `/api/v1/address/<id>/` | Customer | Update address |
| DELETE | `/api/v1/address/<id>/` | Customer | Delete address |

---

## 7. Database Design & Relationships

```
┌──────────────────────┐
│    Organization      │
│ (Vendor/Company)     │
└──────┬───────────────┘
       │ 1:N
       ▼
┌──────────────────────┐     1:N      ┌───────────────────┐
│      User            │─────────────▶│     Address        │
│ (SUPERUSER/ADMIN/    │              │ (Shipping address) │
│  STAFF/CUSTOMER)     │              └───────────────────┘
└──┬───┬───┬───┬───────┘
   │   │   │   │
   │   │   │   │ 1:1        ┌──────────────────┐
   │   │   │   └───────────▶│    Cart           │
   │   │   │                │  └─ CartItem      │──▶ Product
   │   │   │                └──────────────────┘
   │   │   │
   │   │   │ 1:1            ┌──────────────────┐
   │   │   └───────────────▶│    Wishlist       │
   │   │                    │  └─ WishlistItem  │──▶ Product
   │   │                    └──────────────────┘
   │   │
   │   │ 1:N                ┌──────────────────┐
   │   └───────────────────▶│    Order          │
   │                        │  └─ OrderItem     │──▶ Product
   │                        └──────────────────┘
   │
   │ N:1
   ▼
┌──────────────────────┐
│     Product          │
│  └─ ProductImage     │
│  (belongs to Org)    │
└──────────────────────┘
```

---

## 8. Security Measures

| Security Feature | Implementation | Kyu Important |
|-----------------|---------------|---------------|
| Password Hashing | PBKDF2-SHA256 via `make_password()` | Passwords plain text mein store nahi |
| JWT Authentication | Custom middleware + PyJWT | Stateless, scalable auth |
| CORS | django-cors-headers, specific origins | Cross-origin attacks prevention |
| UUID PKs | uuid.uuid4 | Predictable IDs se bachav |
| Role-Based Access | Manual checks in views | Unauthorized access prevention |
| Input Validation | DRF Serializers | SQL injection, bad data prevention |
| CSRF Protection | Django middleware | Form-based attacks prevention |
| Error Handling | APIErrorMiddleware | Error details leak prevention |
| Environment Variables | python-dotenv | Secrets code mein nahi |
| Data Isolation | Organization FK filtering | Vendors ek dusre ka data nahi dekh sakte |
| Rate Limiting | DRF AnonRateThrottle + UserRateThrottle | Brute-force aur DDoS prevention |

---

## 9. Common Follow-Up Questions

**Q: Production mein kya improvements karoge?**  
**A**:
1. **Refresh Tokens** — JWT expire hone pe naya token milna chahiye bina re-login ke
2. **Email verification** — Registration ke baad email verify karna
3. ~~**Pagination**~~ — ✅ Already implemented (DRF PageNumberPagination, 10 items/page)
4. **Caching** — Redis se popular products cache karna
5. ~~**Rate Limiting**~~ — ✅ Already implemented (20/min anon, 60/min user)
6. **Celery** — Async tasks (email sending, report generation)
7. ~~**Logging**~~ — ✅ Already implemented (RotatingFileHandler + Console)
8. **Testing** — Unit tests aur Integration tests
9. **CI/CD** — Automated deployment pipeline
10. **Nginx + Gunicorn** — Production server setup
11. ~~**Swagger API Docs**~~ — ✅ Already implemented (drf-spectacular at `/swagger/`)

**Q: Agar 10 lakh users ho toh kya karoge?**  
**A**:
1. **Database indexing** — Frequently queried fields pe index
2. **Redis caching** — Product listings, session data cache
3. **CDN** — Product images CDN pe serve karna
4. **Database read replicas** — Read queries alag server pe
5. **Load balancer** — Multiple Django instances
6. **Pagination** — Large data sets paginate karna
7. **Async processing** — Celery + RabbitMQ

**Q: Testing kaise karoge?**  
**A**:
1. **Unit Tests** — Har function individually test karna (`django.test.TestCase`)
2. **API Tests** — DRF ka `APIClient` use karke endpoint test karna
3. **Integration Tests** — Full flow test (register → login → add to cart → place order)
4. **Factory Boy** — Test data generate karna

**Q: Payment integration kaise karoge?**  
**A**:
1. **Razorpay/Stripe SDK** integrate karna
2. Order placement ke waqt payment initiate karna
3. **Webhook** se payment confirmation handle karna
4. `is_paid` field update karna after confirmation
5. **Idempotency key** — Duplicate payment prevent karna

---

> 💡 **Tip**: Interview mein bas theory mat bolo — apne project ka code reference do. Jaise:  
> *"Maine `transaction.atomic()` use kiya orders app mein, kyunki stock deduction aur order creation ek saath honi chahiye"*  
> Ye dikhata hai ki tumne actually implement kiya hai, sirf padha nahi hai.

---

*Document generated from project source code analysis. All code examples are from the actual project.*
