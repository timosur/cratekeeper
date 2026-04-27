# Cratekeeper — local development Makefile
#
# Convenience targets for common dev workflows. The repo has two services
# (backend + frontend) with different package managers, so this Makefile
# is the single entry point. Targets are grouped by concern below.
#
# Quick start:
#     make setup          # install deps for both services
#     make db             # start Postgres in Docker
#     make migrate        # apply Alembic migrations
#     make dev            # run backend + frontend together
#
# All targets are safe to re-run.

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SHELL          := /bin/zsh
.SHELLFLAGS    := -eu -o pipefail -c

BACKEND_DIR    := backend
FRONTEND_DIR   := frontend

# Override on the command line, e.g. `make test PYTEST_ARGS="-k events"`
PYTEST_ARGS    ?=

# Bearer token used by both services in dev. Override per session if you
# rotate it: `make dev API_TOKEN=$(openssl rand -hex 16)`.
API_TOKEN      ?= devtoken

.DEFAULT_GOAL  := help

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

.PHONY: help
help: ## Show this help
	@awk 'BEGIN { FS = ":.*?## "; printf "\nUsage: make \033[36m<target>\033[0m\n\n" } \
	     /^[a-zA-Z_-]+:.*?## / { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } \
	     /^## / { printf "\n\033[1m%s\033[0m\n", substr($$0, 4) }' $(MAKEFILE_LIST)

# ---------------------------------------------------------------------------
## Setup
# ---------------------------------------------------------------------------

.PHONY: setup
setup: setup-backend setup-frontend ## Install dependencies for both services

.PHONY: setup-backend
setup-backend: ## Install backend Python deps (uv sync, with test extras)
	cd $(BACKEND_DIR) && uv sync --extra test

.PHONY: setup-frontend
setup-frontend: ## Install frontend npm deps
	cd $(FRONTEND_DIR) && npm install

.PHONY: env
env: $(FRONTEND_DIR)/.env.local ## Create frontend/.env.local from .env.example if missing

$(FRONTEND_DIR)/.env.local: $(FRONTEND_DIR)/.env.example
	@if [ ! -f $@ ]; then \
	  cp $(FRONTEND_DIR)/.env.example $@; \
	  printf 'VITE_API_TOKEN=%s\n' '$(API_TOKEN)' >> $@; \
	  echo "Created $@"; \
	else \
	  echo "$@ already exists — leaving alone"; \
	fi

# ---------------------------------------------------------------------------
## Database
# ---------------------------------------------------------------------------

.PHONY: db
db: ## Start Postgres in Docker (detached)
	docker compose up -d db

.PHONY: db-stop
db-stop: ## Stop the Postgres container
	docker compose stop db

.PHONY: db-logs
db-logs: ## Tail Postgres logs
	docker compose logs -f db

.PHONY: db-reset
db-reset: ## Drop & recreate the dev database (DESTRUCTIVE)
	@printf 'About to drop the dev database. Continue? [y/N] '; \
	read ans; [ "$$ans" = "y" ] || { echo "aborted"; exit 1; }
	docker compose down -v db
	docker compose up -d db
	@echo "Waiting for Postgres to accept connections..."
	@until docker compose exec -T db pg_isready -U dj -d djlib >/dev/null 2>&1; do sleep 0.5; done
	$(MAKE) migrate

.PHONY: migrate
migrate: ## Apply all Alembic migrations
	cd $(BACKEND_DIR) && uv run python -m alembic upgrade head

.PHONY: migration
migration: ## Create a new Alembic migration (usage: make migration m="add column")
	@if [ -z "$(m)" ]; then echo "usage: make migration m=\"<description>\""; exit 1; fi
	cd $(BACKEND_DIR) && uv run python -m alembic revision --autogenerate -m "$(m)"

# ---------------------------------------------------------------------------
## Run
# ---------------------------------------------------------------------------

.PHONY: dev
dev: ## Run backend + frontend together (Ctrl-C stops both)
	@trap 'kill 0' INT TERM; \
	$(MAKE) -j 2 dev-backend dev-frontend

.PHONY: dev-backend
dev-backend: ## Run the FastAPI backend on :8765
	cd $(BACKEND_DIR) && CRATEKEEPER_API_TOKEN=$(API_TOKEN) uv run cratekeeper-api

.PHONY: dev-frontend
dev-frontend: ## Run the Vite dev server on :5173
	cd $(FRONTEND_DIR) && npm run dev

# ---------------------------------------------------------------------------
## Quality
# ---------------------------------------------------------------------------

.PHONY: test
test: test-backend ## Run all tests (currently backend only)

.PHONY: test-backend
test-backend: ## Run backend pytest suite (Docker must be running)
	cd $(BACKEND_DIR) && uv run python -m pytest $(PYTEST_ARGS)

.PHONY: lint
lint: lint-frontend ## Run linters

.PHONY: lint-frontend
lint-frontend: ## Run ESLint
	cd $(FRONTEND_DIR) && npm run lint

.PHONY: build
build: build-frontend ## Build production artefacts

.PHONY: build-frontend
build-frontend: ## Type-check (tsc) + Vite production build
	cd $(FRONTEND_DIR) && npm run build

.PHONY: check
check: lint build test ## Run lint, build, and tests — pre-commit gate

# ---------------------------------------------------------------------------
## Housekeeping
# ---------------------------------------------------------------------------

.PHONY: clean
clean: ## Remove build artefacts and caches
	rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/node_modules/.vite
	find $(BACKEND_DIR) -type d -name __pycache__ -prune -exec rm -rf {} +
	find $(BACKEND_DIR) -type d -name .pytest_cache -prune -exec rm -rf {} +
	find $(BACKEND_DIR) -type d -name .ruff_cache -prune -exec rm -rf {} +

.PHONY: token
token: ## Print a fresh random bearer token (for CRATEKEEPER_API_TOKEN)
	@python3 -c 'import secrets; print(secrets.token_hex(32))'

.PHONY: fernet
fernet: ## Print a fresh CRATEKEEPER_FERNET_KEY
	@cd $(BACKEND_DIR) && uv run python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
