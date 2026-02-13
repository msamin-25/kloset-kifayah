# 🧥 Kloset Kifayah

**Kloset Kifayah** is a full-stack clothing rental and resale platform focused on accessibility, sustainability, and inclusive modest fashion. The platform introduces an optional Modest wear category (hijabs, abayas, thobes, Saree, etc.) while remaining open to all users.

Built using a modern web stack with a **React + TypeScript** frontend and a **Python-powered backend**, Kloset Kifayah integrates **SQL databases**, **Supabase infrastructure**, and a **RAG (Retrieval-Augmented Generation) AI system** to deliver intelligent search and discovery experiences.

---

## 🚀 Overview

Kloset Kifayah aims to bridge fashion accessibility with ethical technology by enabling:

- Clothing rentals (from individual or brands)
- Peer-to-peer resale
- Smart AI-assisted search
- Community-focused fashion discovery

The project explores how structured data, AI retrieval pipelines, and modern UI design can support sustainable marketplaces.

---

## ✨ Features

### 👗 Marketplace System
- List clothing items for rent or sale
- Browse categorized collections
- Dedicated modest-wear section
- Structured item metadata and filtering

### 🤖 AI-Powered Discovery (RAG)
- Retrieval-Augmented Generation pipeline
- Context-aware search results
- Natural language item queries
- Intelligent recommendation flow

### 🔐 Authentication & Infrastructure
- Supabase authentication
- Secure backend APIs
- Scalable deployment setup

### 📊 Data & Backend Logic
- Relational SQL schema
- Python API services
- Efficient data retrieval pipelines

---

## 🏗️ Tech Stack

### Frontend
- React
- TypeScript
- Modern responsive UI

### Backend
- Python (primary backend services)
- RESTful API architecture
- RAG integration

### Database & Cloud
- SQL Database
- Supabase (Auth, Hosting, Database)
- Environment-based configuration

### AI / Data
- Retrieval-Augmented Generation (RAG)
- Structured data retrieval pipelines

---

## 🧠 Architecture

--

#### 🎨 Frontend — React + TypeScript
- Handles UI rendering and user interaction
- Sends API requests to the Python backend
- Displays marketplace listings and AI-generated results
- Implements responsive design and structured filtering

#### 🐍 Backend — Python Services
- Core business logic layer
- RESTful API endpoints
- Connects SQL database with frontend
- Integrates RAG pipeline for intelligent search

#### 🗄️ Database — SQL (Supabase)
- Stores users, listings, clothing metadata, and transactions
- Supports structured querying for fast filtering
- Works alongside AI retrieval for hybrid search

#### 🤖 AI Layer — RAG Pipeline
- Converts user queries into contextual retrieval tasks
- Fetches relevant clothing data
- Generates enhanced recommendations and responses

#### ☁️ Infrastructure — Supabase
- Authentication & session management
- Managed database hosting
- Deployment-ready backend environment

---

### 🔄 Data Flow

1. User submits a search or browsing request from the frontend.
2. React client sends request to Python backend APIs.
3. Backend queries SQL database for structured data.
4. If AI search is triggered:
   - Query is passed to the RAG engine.
   - Relevant context is retrieved.
   - AI generates enhanced output.
5. Backend returns results to frontend for display.

---

### 🎯 Design Goals

- Modular full-stack separation
- Scalable backend services
- AI-enhanced user experience
- Secure and maintainable deployment pipeline

---

