## Architecture Overview

### Frontend (Taro React)
- Multi-platform framework supporting WeChat Mini Program, H5, and other platforms
- React-based component model
- Single codebase compiled to multiple platforms

### Backend (Cloudflare Workers)
- Serverless API endpoints hosted on Cloudflare Edge
- D1 database for persistent storage
- Fast global latency via edge network

### Communication
- Frontend communicates with backend via HTTP RESTful API
- POST /api/analyze for beauty analysis requests
