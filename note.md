# CẤU TRÚC THƯ MỤC VÀ GIẢI THÍCH CHI TIẾT HỆ THỐNG
**Dự án:** HobbyVault - Nền tảng Thương mại Điện tử Đồ chơi & Mô hình Sở thích (MERN Stack & AI Assistant)  
**Mục đích tài liệu:** Tài liệu mô tả cấu trúc thư mục, chức năng từng tập tin phục vụ cho việc tích hợp vào báo cáo kỹ thuật / khóa luận (Microsoft Word).

---

## 1. SƠ ĐỒ CÂY THƯ MỤC TỔNG THỂ (ASCII / DIRECTORY TREE)

> *Gợi ý khi dán vào Word: Hãy chọn khối văn bản bên dưới và đặt định dạng Font chữ là `Consolas` hoặc `Courier New`, cỡ chữ 9–10pt, giãn dòng Single để cây thư mục thẳng hàng đẹp nhất.*

```text
ecommerce-hobby-mern/
├── .env.example                               # File mẫu cấu hình biến môi trường toàn dự án
├── .gitignore                                 # Danh sách file/thư mục loại trừ khỏi Git repository
├── package.json                               # Quản lý dependency và script tổng khởi chạy cả 2 server
├── railway.json                               # File cấu hình triển khai (deployment) lên nền tảng Railway
├── README.md                                  # Tài liệu hướng dẫn cài đặt, cấu hình và tổng quan dự án
├── seed-database.bat                          # File thực thi nạp dữ liệu mẫu nhanh trên Windows
├── setup-and-run.bat                          # Script tự động cài đặt gói thư viện và khởi chạy hệ thống
├── start-servers.bat                          # Script mở đồng thời dev server Frontend & Backend
│
├── server/                                    # [BACKEND] - RESTful API xây dựng trên Node.js & Express
│   ├── .env                                   # Biến môi trường Backend (Port, MongoDB URI, JWT Secret, Gemini Key)
│   ├── .env.example                           # Bản mẫu biến môi trường phục vụ việc thiết lập Backend
│   ├── package.json                           # Khai báo các thư viện Backend (express, mongoose, bcrypt, jwt...)
│   ├── package-lock.json                      # Cố định phiên bản chính xác của các gói npm Backend
│   ├── server.js                              # Điểm khởi chạy (Entry point) chính của máy chủ Express
│   │
│   ├── config/                                # Cấu hình kết nối hệ thống
│   │   └── db.js                              # Thiết lập kết nối cơ sở dữ liệu MongoDB qua Mongoose
│   │
│   ├── models/                                # [MODEL - MVC] Khai báo các Schema dữ liệu Mongoose
│   │   ├── Cart.js                            # Schema giỏ hàng lưu trữ sản phẩm của người dùng
│   │   ├── Category.js                        # Schema danh mục phân loại sản phẩm (Anime, Warhammer, Boardgame)
│   │   ├── Order.js                           # Schema đơn hàng (thông tin người nhận, giỏ hàng, trạng thái thanh toán)
│   │   ├── Product.js                         # Schema sản phẩm hobby (tỷ lệ, phe phái, số người chơi, giá, tồn kho)
│   │   └── User.js                            # Schema người dùng, mã hóa mật khẩu bcrypt và phân quyền (admin/customer)
│   │
│   ├── controllers/                           # [CONTROLLER - MVC] Tầng xử lý nghiệp vụ chính (Business Logic)
│   │   ├── authController.js                  # Nghiệp vụ đăng ký, đăng nhập, kiểm tra thông tin tài khoản hiện hành
│   │   ├── cartController.js                  # Nghiệp vụ giỏ hàng (thêm/sửa/xóa sản phẩm, đồng bộ giỏ vãng lai)
│   │   ├── categoryController.js              # Nghiệp vụ quản lý danh mục sản phẩm (CRUD danh mục)
│   │   ├── chatController.js                  # Nghiệp vụ tiếp nhận tin nhắn chat và kết nối với AI Service
│   │   ├── orderController.js                 # Nghiệp vụ đặt hàng, theo dõi đơn, cập nhật trạng thái đơn hàng
│   │   └── productController.js               # Nghiệp vụ truy vấn, tìm kiếm nâng cao, lọc và CRUD sản phẩm
│   │
│   ├── routes/                                # [ROUTES] Định tuyến các endpoint RESTful API
│   │   ├── authRoutes.js                      # Định tuyến endpoint xác thực người dùng (/api/auth)
│   │   ├── cartRoutes.js                      # Định tuyến endpoint giỏ hàng (/api/cart)
│   │   ├── categoryRoutes.js                  # Định tuyến endpoint danh mục (/api/categories)
│   │   ├── chatRoutes.js                      # Định tuyến endpoint trợ lý ảo AI (/api/chat)
│   │   ├── orderRoutes.js                     # Định tuyến endpoint quản lý đơn hàng (/api/orders)
│   │   └── productRoutes.js                   # Định tuyến endpoint sản phẩm (/api/products)
│   │
│   ├── middlewares/                           # [MIDDLEWARES] Tầng trung gian kiểm soát request
│   │   ├── authMiddleware.js                  # Kiểm tra JWT Token (protect) và kiểm tra quyền Admin (authorize)
│   │   └── errorMiddleware.js                 # Bắt lỗi toàn cục (Global error handler) và chuẩn hóa phản hồi lỗi
│   │
│   ├── services/                              # [SERVICES] Dịch vụ tích hợp bên ngoài
│   │   └── aiService.js                       # Tích hợp Google Gemini AI, prompt engineering tư vấn sản phẩm hobby
│   │
│   └── utils/                                 # [UTILITIES] Các module tiện ích dùng chung
│       ├── ApiError.js                        # Lớp lỗi tùy biến kế thừa Error để chuẩn hóa HTTP status code
│       ├── asyncHandler.js                    # Wrapper hàm bất đồng bộ giúp loại bỏ khối try-catch lặp lại
│       ├── jwt.js                             # Tiện ích tạo và giải mã JSON Web Token
│       ├── seedData.js                        # Bộ dữ liệu mẫu chuẩn (sản phẩm anime, mô hình, boardgame, tài khoản)
│       └── seeder.js                          # Script thực thi nạp dữ liệu mẫu vào cơ sở dữ liệu MongoDB
│
└── client/                                    # [FRONTEND] - Giao diện người dùng xây dựng trên React 18 & Vite
    ├── .env.example                           # Mẫu cấu hình biến môi trường Client (VITE_API_URL)
    ├── index.html                             # Trang HTML gốc chứa thẻ root gắn ứng dụng React
    ├── package.json                           # Khai báo các gói thư viện Frontend (React, Vite, Tailwind, Zustand...)
    ├── package-lock.json                      # Cố định phiên bản các thư viện npm Frontend
    ├── postcss.config.js                      # Cấu hình tiền xử lý CSS cho TailwindCSS
    ├── tailwind.config.js                     # Cấu hình theme Tailwind (màu sắc Obsidian, font chữ, animations)
    ├── vite.config.js                         # File cấu hình bundler Vite
    │
    └── src/                                   # Mã nguồn chính của giao diện ứng dụng
        ├── App.jsx                            # Cấu hình luồng định tuyến (React Router v6) toàn ứng dụng
        ├── index.css                          # Thiết lập CSS toàn cục, Tailwind Directives, thanh cuộn, hiệu ứng kính
        ├── main.jsx                           # Điểm nhập cuộc React DOM, khởi tạo root ứng dụng
        │
        ├── api/                               # Tầng giao tiếp với Backend API
        │   ├── axios.js                       # Cấu hình Axios client kèm interceptor tự động đính kèm JWT token
        │   └── index.js                       # Gom nhóm các hàm gọi API theo từng module chức năng
        │
        ├── store/                             # Quản lý trạng thái toàn cục (Zustand State Management)
        │   ├── authStore.js                   # Lưu trữ phiên đăng nhập, thông tin user và token vào localStorage
        │   ├── cartStore.js                   # Quản lý giỏ hàng (hỗ trợ lưu offline LocalStorage & đồng bộ MongoDB)
        │   └── filterStore.js                 # Quản lý bộ lọc sản phẩm (danh mục, khoảng giá, tỉ lệ, phe phái)
        │
        ├── layouts/                           # Khung bố cục chung cho các trang
        │   ├── MainLayout.jsx                 # Bố cục trang khách hàng (Navbar + Main Content + Footer + ChatWidget)
        │   ├── AdminLayout.jsx                # Bố cục trang quản trị (Admin Sidebar + Header + Dashboard Content)
        │   └── ProtectedRoute.jsx             # HOC bảo vệ tuyến đường yêu cầu đăng nhập hoặc quyền Admin
        │
        ├── components/                        # Các thành phần giao diện tái sử dụng
        │   ├── Badge.jsx                      # Component hiển thị nhãn trạng thái (tồn kho, giảm giá, danh mục)
        │   ├── CartDrawer.jsx                 # Ngăn kéo giỏ hàng trượt cạnh phải (Mini-cart drawer thao tác nhanh)
        │   ├── FilterSidebar.jsx              # Thanh bộ lọc nhiều tiêu chí chuyên sâu theo ngành hàng hobby
        │   ├── Footer.jsx                     # Chân trang hiển thị thông tin thương hiệu, liên hệ và chính sách
        │   ├── Modal.jsx                      # Hộp thoại popup đa năng (xác nhận xóa, thông báo, cảnh báo)
        │   ├── Navbar.jsx                     # Thanh điều hướng trên cùng (tìm kiếm, giỏ hàng, menu người dùng)
        │   ├── ProductCard.jsx                # Card hiển thị thông tin tóm tắt sản phẩm trên danh mục/trang chủ
        │   │
        │   └── Chatbox/                       # Phân hệ trợ lý ảo AI tư vấn khách hàng (AI Chat Widget)
        │       ├── index.js                   # File export tập trung các component con của Chatbox
        │       ├── ChatHeader.jsx             # Tiêu đề khung chat (Avatar AI, trạng thái trực tuyến, nút thu nhỏ)
        │       ├── ChatInput.jsx              # Thanh nhập tin nhắn kèm nút gửi và xử lý phím tắt Enter
        │       ├── ChatMarkdown.jsx           # Render nội dung trả lời của AI hỗ trợ định dạng Markdown, link
        │       ├── ChatMessageList.jsx        # Danh sách hiển thị lịch sử tin nhắn giữa User và AI Assistant
        │       ├── ChatWidget.jsx             # Nút floating tròn góc phải và toàn bộ khung chat popup
        │       ├── ProductPreviewCard.jsx     # Card preview sản phẩm trực tiếp bên trong tin nhắn AI đề xuất
        │       └── QuickSuggestions.jsx       # Các nút câu hỏi gợi ý nhanh (Tìm figure, Gợi ý quà tặng, Tra cứu)
        │
        └── pages/                             # Các trang giao diện hoàn chỉnh (Views)
            ├── CartPage.jsx                   # Trang giỏ hàng đầy đủ, chỉnh sửa số lượng, kiểm tra tổng tiền
            ├── CatalogPage.jsx                # Trang thư viện sản phẩm tích hợp bộ lọc chi tiết và phân trang
            ├── CheckoutPage.jsx               # Trang thanh toán (nhập thông tin giao hàng, phương thức thanh toán)
            ├── HomePage.jsx                   # Trang chủ (Banner Hero, sản phẩm bán chạy, danh mục tiêu biểu)
            ├── LoginPage.jsx                  # Trang đăng nhập tài khoản khách hàng / tài khoản quản trị
            ├── OrderSuccessPage.jsx           # Trang thông báo đặt hàng thành công, hiển thị mã vận đơn
            ├── ProductDetailPage.jsx          # Trang chi tiết sản phẩm (bộ sưu tập ảnh, thông số kỹ thuật, đánh giá)
            ├── RegisterPage.jsx               # Trang đăng ký thành viên mới
            ├── UserOrdersPage.jsx             # Trang lịch sử đơn hàng của người dùng, theo dõi tiến độ giao hàng
            │
            └── admin/                         # Phân hệ trang dành riêng cho Quản trị viên (Admin)
                ├── AdminCategoriesPage.jsx    # Quản lý danh mục sản phẩm (thêm, sửa, xóa danh mục)
                ├── AdminDashboardPage.jsx     # Bảng điều khiển tổng quan (thống kê doanh thu, đơn hàng, khách hàng)
                ├── AdminOrdersPage.jsx        # Quản lý toàn bộ đơn hàng (cập nhật trạng thái xử lý/vận chuyển)
                └── AdminProductsPage.jsx      # Quản lý sản phẩm (thêm mới, chỉnh sửa thông số, quản lý kho hàng)
```

---

## 2. BẢNG CHÚ THÍCH CHI TIẾT TỪNG THÀNH PHẦN (DÙNG ĐỂ GỘP VÀO BÁO CÁO WORD)

> *Gợi ý: Các bảng bên dưới tuân thủ định dạng Markdown Table. Khi copy vào Microsoft Word, bạn chỉ cần dán (Ctrl+V) hoặc chọn Convert Text to Table là Word sẽ tự động sinh bảng chuẩn, có thể tô màu Header và viền bảng theo phong cách báo cáo.*

### 2.1. Thư mục gốc & Các tập tin cấu hình chung (Root Level)

| Tên tập tin / Thư mục | Định dạng | Chức năng & Vai trò trong dự án |
| :--- | :--- | :--- |
| `ecommerce-hobby-mern/` | Directory | Thư mục gốc chứa toàn bộ mã nguồn của hệ thống bao gồm cả Client và Server. |
| `.env.example` | Config File | Mẫu khai báo các biến môi trường cấu hình mẫu cho dự án. |
| `.gitignore` | Git Config | Định nghĩa các tệp tin và thư mục không được đẩy lên kho mã nguồn (ví dụ: `node_modules`, `.env`). |
| `package.json` | JSON | Tập tin quản lý dự án cấp gốc, cung cấp các script lệnh gộp (`install-all`, `server`, `client`, `seed`). |
| `railway.json` | Config | Cấu hình triển khai tự động hạ tầng ứng dụng lên dịch vụ đám mây Railway. |
| `README.md` | Markdown | Bản tài liệu hướng dẫn kỹ thuật, tổng quan kiến trúc hệ thống và hướng dẫn cài đặt chạy ứng dụng. |
| `seed-database.bat` | Batch Script | Kịch bản dòng lệnh trên Windows hỗ trợ tự động nạp dữ liệu khởi tạo vào cơ sở dữ liệu MongoDB. |
| `setup-and-run.bat` | Batch Script | Script hỗ trợ tự động cài đặt `npm install` cho cả 2 phía và khởi động toàn bộ hệ sinh thái. |
| `start-servers.bat` | Batch Script | Script chạy song song 2 cửa sổ terminal cho Backend (Port 5000) và Frontend (Port 5173). |

---

### 2.2. Phân hệ Máy chủ Backend (`server/`) - Kiến trúc MVC & Dịch vụ

#### A. Cấu hình & Tập tin cốt lõi
| Tên tập tin / Thư mục | Chức năng chính |
| :--- | :--- |
| `server/` | Thư mục chứa toàn bộ mã nguồn máy chủ RESTful API phát triển bằng Node.js và Express.js. |
| `server/.env` | Chứa các biến môi trường nhạy cảm: Cổng máy chủ (`PORT`), chuỗi kết nối (`MONGO_URI`), khóa bí mật (`JWT_SECRET`), và API key (`GEMINI_API_KEY`). |
| `server/server.js` | Điểm khởi đầu của ứng dụng Backend: khởi tạo Express, kích hoạt CORS, phân tích JSON body, kết nối CSDL, đăng ký các Router và gắn middleware xử lý lỗi. |
| `server/config/db.js` | Khởi tạo kết nối bất đồng bộ tới cơ sở dữ liệu MongoDB thông qua thư viện Mongoose ORM/ODM. |

#### B. Tầng Dữ liệu - Mongoose Models (`server/models/`)
| Tên tập tin Model | Chức năng & Các trường dữ liệu chính |
| :--- | :--- |
| `User.js` | Quản lý người dùng: `name`, `email`, `password` (băm tự động bằng `bcryptjs`), `role` (`customer` hoặc `admin`). Cung cấp phương thức đối chiếu mật khẩu `matchPassword`. |
| `Category.js` | Quản lý danh mục hàng hóa: `name`, `slug`, `description`, `image`, `subcategories` (Anime Figures, Warhammer 40k, Board Games). |
| `Product.js` | Quản lý sản phẩm hobby chuyên sâu: `name`, `price`, `images`, `stock`, `rating`, `category`. Chứa các trường đặc thù: `scale` (1/7, 1/4, Nendoroid), `faction` (Imperium, Chaos, Xenos), `playerCount`, `playTime`, `complexity`. |
| `Cart.js` | Quản lý giỏ hàng lưu trữ trên máy chủ của người dùng đăng nhập: liên kết `user`, danh sách `items` (`product`, `quantity`, `priceAtAdd`). |
| `Order.js` | Quản lý đơn hàng: liên kết `user`, `orderItems`, `shippingAddress`, `paymentMethod`, `totalPrice`, `orderStatus` (`pending`, `confirmed`, `shipping`, `completed`, `cancelled`), `isPaid`. |

#### C. Tầng Xử lý Nghiệp vụ - Controllers (`server/controllers/`)
| Tên tập tin Controller | Nghiệp vụ đảm nhiệm |
| :--- | :--- |
| `authController.js` | Đăng ký tài khoản mới, xác thực thông tin đăng nhập, sinh JWT token và trả về thông tin người dùng đang hoạt động. |
| `categoryController.js` | Lấy danh sách danh mục phân loại, thêm mới, sửa đổi hoặc xóa danh mục (yêu cầu quyền Admin). |
| `productController.js` | Truy vấn danh sách sản phẩm với các bộ lọc phức tạp (theo danh mục, tầm giá, faction, scale, từ khóa), phân trang dữ liệu, lấy sản phẩm liên quan và các thao tác CRUD dành cho quản trị viên. |
| `cartController.js` | Lấy giỏ hàng của tài khoản, thêm sản phẩm, cập nhật số lượng, xóa từng món hoặc xóa toàn bộ; đặc biệt hỗ trợ đồng bộ giỏ hàng từ khách chưa đăng nhập sau khi đăng nhập thành công. |
| `orderController.js` | Tạo đơn hàng mới (tự động kiểm tra và trừ tồn kho sản phẩm), xem chi tiết đơn hàng của cá nhân, xem toàn bộ đơn hàng và cập nhật tiến độ giao vận (Admin). |
| `chatController.js` | Nhận tin nhắn và ngữ cảnh của khách hàng, điều phối dữ liệu sản phẩm tương ứng và gọi tới `aiService` để nhận câu trả lời tư vấn tự động. |

#### D. Tầng Định tuyến & Kiểm soát - Routes, Middlewares, Services & Utils
| Tên tập tin | Danh mục | Ý nghĩa kỹ thuật |
| :--- | :--- | :--- |
| `routes/authRoutes.js` | Router | Khai báo các đường dẫn API xác thực: `/register`, `/login`, `/me`. |
| `routes/categoryRoutes.js` | Router | Khai báo các đường dẫn API danh mục: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`. |
| `routes/productRoutes.js` | Router | Khai báo các đường dẫn API sản phẩm: `GET /`, `GET /:id`, `GET /featured`, `POST /`, `PUT /:id`, `DELETE /:id`. |
| `routes/cartRoutes.js` | Router | Khai báo các đường dẫn API giỏ hàng: `GET /`, `POST /add`, `PUT /item`, `DELETE /item/:id`, `POST /sync`. |
| `routes/orderRoutes.js` | Router | Khai báo các đường dẫn API đơn hàng: `POST /`, `GET /my-orders`, `GET /:id`, `GET /` (Admin), `PUT /:id/status` (Admin). |
| `routes/chatRoutes.js` | Router | Khai báo đường dẫn API trò chuyện: `POST /message`. |
| `middlewares/authMiddleware.js` | Middleware | Gồm `protect` (xác thực Bearer JWT token ở header) và `authorize('admin')` (chặn người dùng không có quyền quản trị). |
| `middlewares/errorMiddleware.js` | Middleware | Bắt mọi lỗi phát sinh trong luồng xử lý ứng dụng, phân biệt môi trường Development/Production để ẩn hiện `stack trace`. |
| `services/aiService.js` | Service | Dịch vụ AI tích hợp Google Gemini API: Thiết lập System Instruction đóng vai chuyên gia đồ chơi/mô hình, phân tích nhu cầu và gợi ý chính xác sản phẩm có sẵn trong kho. |
| `utils/ApiError.js` | Utility | Class kế thừa từ `Error` nguyên bản giúp chuẩn hóa mã trạng thái HTTP (400, 401, 403, 404, 500). |
| `utils/asyncHandler.js` | Utility | Higher-order function bao bọc các hàm controller bất đồng bộ, tự động chuyển ngoại lệ sang middleware bắt lỗi. |
| `utils/jwt.js` | Utility | Hàm hỗ trợ ký phát (sign) token JWT với hạn sử dụng và giải mã token. |
| `utils/seedData.js` | Utility | Bộ dữ liệu khởi tạo phong phú gồm danh mục, người dùng mẫu và các sản phẩm mô hình chi tiết. |
| `utils/seeder.js` | Utility | Script chạy dòng lệnh dùng để xóa sạch CSDL hoặc nạp mới toàn bộ dữ liệu mẫu vào MongoDB. |

---

### 2.3. Phân hệ Giao diện Frontend (`client/`) - Kiến trúc Component-Based

#### A. Cấu hình nền tảng & Điểm khởi đầu
| Tên tập tin | Vai trò kỹ thuật |
| :--- | :--- |
| `client/` | Thư mục chứa mã nguồn giao diện Single Page Application (SPA) phát triển bằng React 18 và Vite. |
| `client/index.html` | Trang khung HTML5 cơ sở, chứa cấu hình thẻ meta, favicon và phần tử container `<div id="root"></div>`. |
| `client/vite.config.js` | Cấu hình cho công cụ đóng gói và máy chủ phát triển Vite. |
| `client/tailwind.config.js` | Mở rộng bảng màu giao diện với phong cách Obsidian Dark (`vault-950`), màu sắc thương hiệu Warhammer/Anime và hiệu ứng viền phát sáng. |
| `client/src/main.jsx` | Điểm kích hoạt React 18 (sử dụng `createRoot`), bao bọc ứng dụng trong `BrowserRouter`. |
| `client/src/App.jsx` | Trung tâm cấu hình định tuyến (Routing) cho toàn bộ trang của khách hàng và phân hệ quản trị viên. |
| `client/src/index.css` | Nạp font chữ, Tailwind directives, hiệu ứng mờ kính (glassmorphism) và tùy biến thanh cuộn đẹp mắt. |

#### B. Tầng Kết nối API & Quản lý Trạng thái (API & State Management)
| Tên tập tin | Loại thành phần | Mục đích và cơ chế hoạt động |
| :--- | :--- | :--- |
| `src/api/axios.js` | Network Service | Tạo Axios instance dùng chung; gắn cấu hình `baseURL` và Interceptor tự động lấy token từ `localStorage` đính kèm vào HTTP Header `Authorization`. |
| `src/api/index.js` | API Gateway | Tập hợp toàn bộ các lời gọi API từ client chia theo nhóm: `authAPI`, `productAPI`, `categoryAPI`, `cartAPI`, `orderAPI`, `chatAPI`. |
| `src/store/authStore.js` | Zustand Store | Quản lý trạng thái phiên làm việc: lưu trữ thông tin tài khoản đăng nhập, token, xử lý hành động đăng nhập/đăng xuất và cung cấp tài khoản demo. |
| `src/store/cartStore.js` | Zustand Store | Quản lý giỏ hàng thời gian thực: hỗ trợ chế độ kép (Guest lưu trữ ở `localStorage`, User đã đăng nhập lưu vào MongoDB), tự động tính tổng tiền và số lượng. |
| `src/store/filterStore.js` | Zustand Store | Quản lý tiêu chí lọc và sắp xếp sản phẩm trên toàn ứng dụng (danh mục đang chọn, mức giá tối thiểu/tối đa, faction, scale, độ phức tạp). |

#### C. Bố cục & Bảo vệ tuyến đường (Layouts)
| Tên tập tin Layout | Chức năng cụ thể |
| :--- | :--- |
| `src/layouts/MainLayout.jsx` | Bố cục chuẩn cho khu vực mua sắm của khách hàng: tích hợp `Navbar` ở trên cùng, vùng nội dung `<Outlet />`, `Footer` ở dưới và nút trợ lý ảo `ChatWidget` nổi góc phải. |
| `src/layouts/AdminLayout.jsx` | Bố cục khu vực quản trị: thanh điều hướng bên hông (Sidebar), thanh thông tin đầu trang và vùng hiển thị dữ liệu bảng điều khiển. |
| `src/layouts/ProtectedRoute.jsx` | Thành phần bảo vệ route: kiểm tra xem người dùng đã đăng nhập chưa, nếu chưa sẽ chuyển hướng về `/login`; kiểm tra thêm quyền `admin` đối với các đường dẫn quản trị. |

#### D. Các Component giao diện dùng chung (`src/components/`)
| Tên Component | Mục đích sử dụng |
| :--- | :--- |
| `Navbar.jsx` | Thanh điều hướng trên cùng hiển thị logo, danh mục nhanh, ô tìm kiếm thông minh, nút mở giỏ hàng và menu tài khoản cá nhân. |
| `Footer.jsx` | Chân trang chứa thông tin về cửa hàng, bản quyền, liên kết chính sách bảo hành, đổi trả và mạng xã hội. |
| `ProductCard.jsx` | Thẻ sản phẩm tái sử dụng: thể hiện hình ảnh sắc nét, tên, danh mục, tỷ lệ/phe phái, giá bán, đánh giá sao và nút thêm nhanh vào giỏ. |
| `FilterSidebar.jsx` | Thanh bộ lọc chuyên sâu cho phép người dùng lọc sản phẩm theo nhiều tiêu chí ngành hàng hobby một cách trực quan. |
| `CartDrawer.jsx` | Ngăn kéo giỏ hàng trượt ra từ bên phải màn hình khi click vào biểu tượng giỏ hàng, cho phép tăng/giảm số lượng và đi thẳng tới thanh toán. |
| `Badge.jsx` | Huy hiệu hiển thị trạng thái tồn kho, nhãn danh mục, tỷ lệ mô hình với phong cách màu sắc hài hòa. |
| `Modal.jsx` | Khung pop-up hiển thị đè lên màn hình dùng cho các tác vụ cần xác nhận (xóa sản phẩm, hủy đơn, thông báo quan trọng). |

#### E. Phân hệ Trợ lý ảo AI Thông minh (`src/components/Chatbox/`)
| Tên Component | Vai trò trong hệ thống Chatbot |
| :--- | :--- |
| `ChatWidget.jsx` | Quản lý đóng/mở cửa sổ trò chuyện và nút bấm nổi (Floating Action Button) có hiệu ứng viền phát sáng ở góc màn hình. |
| `ChatHeader.jsx` | Phần đầu hộp thoại hiển thị tên trợ lý "HobbyVault AI Assistant", trạng thái sẵn sàng và các nút thu nhỏ/đóng. |
| `ChatMessageList.jsx` | Khu vực hiển thị toàn bộ lịch sử trao đổi, hỗ trợ hiển thị hiệu ứng bong bóng tin nhắn và hiệu ứng AI đang soạn thảo (typing indicator). |
| `ChatInput.jsx` | Khung nhập văn bản cho phép người dùng đặt câu hỏi, có nút gửi và hỗ trợ gửi nhanh bằng phím Enter. |
| `ChatMarkdown.jsx` | Bộ biên dịch văn bản từ AI sang HTML chuẩn Markdown: định dạng chữ đậm, chữ nghiêng, danh sách gạch đầu dòng và trích dẫn. |
| `ProductPreviewCard.jsx` | Card xem trước sản phẩm được nhúng trực tiếp ngay trong câu trả lời của AI, cho phép xem giá và click xem chi tiết ngay lập tức. |
| `QuickSuggestions.jsx` | Các thẻ gợi ý câu hỏi nhanh (Ví dụ: *"Gợi ý Figure giá dưới 1 triệu"*, *"Mô hình Warhammer cho người mới"*). |

#### F. Các trang giao diện người dùng (`src/pages/`)
| Tên Trang | Chức năng chi tiết |
| :--- | :--- |
| `HomePage.jsx` | Trang chủ của cửa hàng: trình bày banner nổi bật, các nhóm sản phẩm mới về, sản phẩm bán chạy và các cam kết chất lượng. |
| `CatalogPage.jsx` | Trang xem toàn bộ sản phẩm: tích hợp đồng bộ với `FilterSidebar`, thanh sắp xếp theo giá/đánh giá và phân trang. |
| `ProductDetailPage.jsx` | Trang thông tin chi tiết một sản phẩm: thư viện ảnh, chọn số lượng, bảng thuộc tính chi tiết theo dòng đồ chơi, mô tả và danh sách sản phẩm liên quan. |
| `CartPage.jsx` | Trang giỏ hàng chuyên biệt: liệt kê chi tiết từng sản phẩm, đơn giá, tổng giá trị tạm tính và nút chuyển tiếp sang thanh toán. |
| `CheckoutPage.jsx` | Trang hoàn tất đơn hàng: thu thập thông tin nhận hàng, số điện thoại, ghi chú giao hàng và lựa chọn hình thức thanh toán. |
| `OrderSuccessPage.jsx` | Trang xác nhận đặt hàng thành công: hiển thị mã đơn hàng, ngày đặt, tổng tiền và đường dẫn tra cứu tiến độ đơn. |
| `UserOrdersPage.jsx` | Trang lịch sử đơn hàng của người dùng: hiển thị danh sách đơn từng đặt kèm trạng thái xử lý thực tế (`Pending`, `Shipping`, `Completed`...). |
| `LoginPage.jsx` | Trang đăng nhập hệ thống: có biểu mẫu nhập email/mật khẩu cùng tính năng 1-click đăng nhập nhanh bằng tài khoản Demo. |
| `RegisterPage.jsx` | Trang đăng ký thành viên mới với kiểm tra hợp lệ dữ liệu họ tên, email và độ dài mật khẩu. |

#### G. Phân hệ Quản trị viên (`src/pages/admin/`)
| Tên Trang Quản trị | Chức năng nghiệp vụ quản lý |
| :--- | :--- |
| `AdminDashboardPage.jsx` | Bảng điều khiển trung tâm: biểu đồ và thẻ số liệu thống kê tổng doanh thu, số đơn hàng mới, tổng số sản phẩm và số lượng người dùng. |
| `AdminProductsPage.jsx` | Quản lý kho hàng: hiển thị danh sách dạng bảng, công cụ tìm kiếm, modal tạo mới và chỉnh sửa sản phẩm với đầy đủ thông số kỹ thuật. |
| `AdminOrdersPage.jsx` | Quản lý vận hành đơn hàng: duyệt đơn, theo dõi địa chỉ khách hàng và cập nhật chuyển đổi trạng thái đơn từ lúc nhận đến khi hoàn tất. |
| `AdminCategoriesPage.jsx` | Quản lý phân loại: thêm danh mục mới, chỉnh sửa tên/slug danh mục và hình ảnh đại diện. |

---

## 3. TÓM TẮT CÔNG NGHỆ VÀ MÔ HÌNH KIẾN TRÚC

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        KIẾN TRÚC HỆ THỐNG MERN                         │
└────────────────────────────────────────────────────────────────────────┘

    [ TRÌNH DUYỆT / NGƯỜI DÙNG ]
                 │
                 ▼
    ┌─────────────────────────┐
    │  REACT 18 + VITE (SPA)  │
    │  - Styling: TailwindCSS │
    │  - State: Zustand       │
    │  - Router: React Router │
    │  - AI Widget: Markdown  │
    └────────────┬────────────┘
                 │ (HTTP Requests + JWT Token qua Axios)
                 ▼
    ┌─────────────────────────┐
    │   NODE.JS & EXPRESS.JS  │
    │  - Strict MVC Pattern   │
    │  - Middlewares & Auth   │
    │  - RESTful API Services │
    └──────┬───────────┬──────┘
           │           │
           │           ▼
           │     ┌────────────────────────┐
           │     │ GOOGLE GEMINI AI API   │
           │     │ (aiService.js)         │
           │     └────────────────────────┘
           ▼
    ┌─────────────────────────┐
    │   MONGODB DATABASE      │
    │  - Mongoose ODM Models  │
    │  - Indexes & Validation │
    └─────────────────────────┘
```

1. **Mô hình Backend:** Triển khai theo cấu trúc **MVC (Model - View - Controller)** kết hợp **Service Layer**:
   - **Model:** Định nghĩa thực thể dữ liệu và quy tắc ràng buộc thông qua Mongoose Schemas.
   - **Controller:** Tiếp nhận dữ liệu, thực thi kiểm tra nghiệp vụ và trả kết quả dưới dạng JSON chuẩn.
   - **Service:** Độc lập các tích hợp phức tạp từ bên thứ ba (tiêu biểu là dịch vụ AI Gemini trong `aiService.js`).
   - **Middleware:** Đảm bảo bảo mật đa tầng qua JSON Web Token (JWT) và kiểm soát phân quyền dựa trên vai trò (Role-Based Access Control - RBAC).

2. **Mô hình Frontend:** Thiết kế theo phương pháp **Component-Driven Architecture**:
   - Tách biệt rõ ràng giữa **Components** (thành phần tái sử dụng), **Layouts** (bố cục khung trang) và **Pages** (màn hình hiển thị).
   - Tối ưu hóa hiệu năng trạng thái toàn cục bằng **Zustand**, cho phép đồng bộ giỏ hàng linh hoạt giữa phiên ẩn danh (Guest) và phiên người dùng chính thức (User).

3. **Tính năng Trợ lý ảo AI:**
   - Sử dụng mô hình AI của Google để phân tích ngôn ngữ tự nhiên, hiểu rõ nhu cầu của khách hàng về mô hình sở thích và đối chiếu trực tiếp với danh mục sản phẩm của hệ thống để đưa ra gợi ý kèm thẻ xem nhanh sản phẩm trực quan.
