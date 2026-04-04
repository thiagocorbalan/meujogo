.PHONY: setup start stop restart build logs logs-api logs-app db-studio db-migrate db-seed clean

## setup - Instala dependencias e sobe o ambiente pela primeira vez
setup:
	docker compose build
	docker compose up -d postgres
	@echo "Aguardando PostgreSQL..."
	@sleep 3
	docker compose up -d
	docker compose exec api npx prisma migrate dev
	@echo "Setup completo! App: http://localhost:4000 | API: http://localhost:3000"

## start - Sobe todos os servicos (app + api + postgres)
start:
	docker compose up -d

## stop - Para todos os servicos
stop:
	docker compose down

## restart - Reinicia todos os servicos
restart:
	docker compose down
	docker compose up -d

## build - Rebuilda as imagens e reinicia
build:
	docker compose up -d --build

## logs - Mostra logs de todos os servicos
logs:
	docker compose logs -f

## logs-api - Mostra logs apenas da API
logs-api:
	docker compose logs -f api

## logs-app - Mostra logs apenas do App
logs-app:
	docker compose logs -f app

## db-studio - Abre o Prisma Studio (porta 5555)
db-studio:
	cd api && npx prisma studio

## db-migrate - Roda as migrations pendentes
db-migrate:
	docker compose exec api npx prisma migrate dev

## db-seed - Roda o seed (cria usuario admin padrao)
db-seed:
	docker compose exec api npx prisma db seed

## clean - Para tudo e remove volumes (APAGA DADOS DO BANCO)
clean:
	docker compose down -v

## help - Mostra os comandos disponiveis
help:
	@echo "Comandos disponiveis:"
	@echo "  make setup       - Instala dependencias e sobe o ambiente"
	@echo "  make start       - Sobe todos os servicos"
	@echo "  make stop        - Para todos os servicos"
	@echo "  make restart     - Reinicia todos os servicos"
	@echo "  make build       - Rebuilda imagens e reinicia"
	@echo "  make logs        - Logs de todos os servicos"
	@echo "  make logs-api    - Logs da API"
	@echo "  make logs-app    - Logs do App"
	@echo "  make db-studio   - Abre Prisma Studio"
	@echo "  make db-migrate  - Roda migrations pendentes"
	@echo "  make db-seed     - Roda seed (cria admin padrao)"
	@echo "  make clean       - Para tudo e remove volumes (apaga dados)"
