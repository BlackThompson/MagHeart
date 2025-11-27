# 🏗️ **MagHeart 项目部署文档（可复用模板）**

> 适用于：FastAPI 后端 + 前端构建产物 + Dockers + Nginx + HTTPS
>  后续新项目只需复制本指南，改 domain/port 即可上线。

------

## 【一】准备环境
```

### 1. 服务目录结构（标准化）

```
/app/
 ├─ MagHeart
 │   ├─ backend/  ← FastAPI
 │   ├─ frontend/ ← 打包后的dist/html
 ├─ EchoMind （未来同结构）
```

每个项目对应两个容器（前端+后端）

------

## 【二】启动 MagHeart 服务

### Backend -> 8176

### Frontend -> 6176

```
docker compose -f docker-compose-magheart.yml up -d --build
```

确认容器运行：

```
docker ps
```

------

## 【三】配置 Nginx 用于反向代理

### 1. 新建 Nginx 配置文件

```
nano /etc/nginx/conf.d/magheart.conf
```

填入以下（通用生产版模板）：

```
# =========================
# 🔥 MagHeart Production Nginx
# Frontend → 127.0.0.1:6176
# Backend  → 127.0.0.1:8176
# SSL      → Auto-renew via Certbot
# =========================

# HTTP → 自动跳转 HTTPS
server {
    listen 80;
    server_name magheart.uniqsea.com;
    return 301 https://$host$request_uri;
}

# HTTPS 主服务入口
server {
    listen 443 ssl http2;
    server_name magheart.uniqsea.com;

    ssl_certificate     /etc/letsencrypt/live/magheart.uniqsea.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/magheart.uniqsea.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # ===== 前端静态文件 ‎=====
    location / {
        proxy_pass http://127.0.0.1:6176;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ===== API =====
    location /api/ {
        proxy_pass http://127.0.0.1:8176/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ===== SSE =====
    location = /events {
        proxy_pass http://127.0.0.1:8176/events;
        proxy_buffering off;
    }

    # ===== 后端模块 =====
    location /cocreation/ {
        proxy_pass http://127.0.0.1:8176/cocreation/;
        proxy_set_header Host $host;
    }

    # ===== WebSocket =====
    location /cocreation/ws/ {
        proxy_pass http://127.0.0.1:8176;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

保存后重载：

```
nginx -t && systemctl reload nginx
```

------

## 【四】域名绑定 DNS

到阿里云 → 域名解析 → 新增 A 记录

| 主机记录 | 类型 | 值           |
| -------- | ---- | ------------ |
| magheart | A    | 服务器公网IP |

验证：

```
ping magheart.uniqsea.com
```

能返回 IP 即成功。

------
server {
    listen 80;
    server_name echomind.uniqsea.com;
    location / { proxy_pass http://127.0.0.1:5176; }
    location /api/ { proxy_pass http://127.0.0.1:7176/api/; }
}

## 【五】申请 HTTPS 免费证书（Let’s Encrypt）

```
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

执行签发：

```
sudo certbot --nginx -d magheart.uniqsea.com
```

选择：

```
邮箱 → 输入
协议 → Y
是否跳转 HTTPS → 2 (Redirect)
```

成功标志：

```
Congratulations! HTTPS enabled
```

打开测试：

```
https://magheart.uniqsea.com
```

网页有 🔒 即完成部署。

------

# 🔥 **此文档为可复制 SOP 模板**

后续部署 EchoMind / 第三个项目时：

只需替换以下内容：

| 项目         | 需要替换                                        |
| ------------ | ----------------------------------------------- |
| 端口         | 6176 → 6180、8176 → 8180                        |
| 域名         | `magheart.uniqsea.com` → `echomind.uniqsea.com` |
| Nginx 文件名 | `/etc/nginx/conf.d/echomind.conf`               |

整套流程**可重复使用**
 最快 5 分钟部署一个新项目。

------

若你愿意，我能继续生成：

📌 EchoMind 同模板配置（立即可部署）
 📌 服务器部署架构图（视觉理解更加直观）
 📌 一键多项目部署脚本 deploy.sh

只需要你一句话：

👉 **生成 EchoMind 部署文档**
 👉 **做架构图**
 👉 **写一键部署脚本**

说哪个，我就继续。🚀

##### 你说：

只写命令就行

###### ChatGPT 说：

明白，你要的是**可直接复用的纯命令部署流程**
 下面是 *MagHeart 部署全流程命令版*——也可用于后续所有项目。

------

# 📌 **MagHeart 部署完整命令脚本版（可复用）**

## ① 创建并运行 Docker 服务

```
docker compose -f docker-compose-magheart.yml up -d --build
```

------

## ② 新建 Nginx 站点配置文件

```
nano /etc/nginx/conf.d/magheart.conf
```

粘贴配置（无需解释）：

```
server {
    listen 80;
    server_name magheart.uniqsea.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name magheart.uniqsea.com;

    ssl_certificate     /etc/letsencrypt/live/magheart.uniqsea.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/magheart.uniqsea.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    location / { proxy_pass http://127.0.0.1:6176; }
    location /api/ { proxy_pass http://127.0.0.1:8176/api/; }
    location = /events { proxy_pass http://127.0.0.1:8176/events; proxy_buffering off; }
    location /cocreation/ { proxy_pass http://127.0.0.1:8176/cocreation/; }
    location /cocreation/ws/ {
        proxy_pass http://127.0.0.1:8176;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

------

## ③ 重载 Nginx

```
nginx -t && systemctl reload nginx
```

------

## ④ 阿里云 DNS（只需执行一次）

```
类型 A
主机记录 magheart
记录值 服务器IP
```

验证：

```
ping magheart.uniqsea.com
```

------

## ⑤ 安装 Certbot 并申请证书

```
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d magheart.uniqsea.com
```

【选择】
 邮箱 → 回车
 协议 → Y
 跳转HTTPS → 2（Redirect）

------

## ⑥ 验证最终上线

```
curl -I https://magheart.uniqsea.com
```

返回 200/301 → 部署完成

------

# ⚡ 未来新项目部署，只改两处：

```
域名替换   magheart.uniqsea.com
端口替换   6176/8176 → 新端口
```

其他命令保持完全不变。
docker compose up --build -d