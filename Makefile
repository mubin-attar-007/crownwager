# Convenience targets. Requires Docker. (Windows: run via Git Bash / WSL, or use the commands directly.)
COMPOSE = docker compose -f infrastructure/docker-compose.yml

.PHONY: up down logs ps seed migrate test test-backend test-ai test-frontend build clean

up:            ## Build + start the full stack
	$(COMPOSE) up --build -d

down:          ## Stop the stack
	$(COMPOSE) down

clean:         ## Stop the stack and drop volumes (resets the DB)
	$(COMPOSE) down -v

logs:          ## Tail logs
	$(COMPOSE) logs -f

ps:            ## Show service status
	$(COMPOSE) ps

migrate:       ## Run DB migrations
	$(COMPOSE) exec backend python manage.py migrate

seed:          ## Seed demo data (admin user, bookmakers, articles)
	$(COMPOSE) exec backend python manage.py seed_demo

test: test-backend test-ai test-frontend  ## Run all test suites

test-backend:  ## Backend tests (Django + DRF)
	docker run --rm -v "$(CURDIR)/backend:/app" oddsaway-backend:dev pytest -q

test-ai:       ## AI service tests (FastAPI)
	docker run --rm oddsaway-ai:dev sh -c "pip install -q pytest httpx && pytest ai/tests -q"

test-frontend: ## Frontend unit tests (Vitest)
	docker run --rm -v "$(CURDIR)/frontend:/app" -v /app/node_modules -w /app node:22-alpine \
		sh -c "npm install --silent && npm test"

help:          ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  %-14s %s\n", $$1, $$2}'
