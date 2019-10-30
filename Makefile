.DEFAULT_GOAL := deploy
GREEN='\033[0;32m'
YELLOW='\033[1;33m'

deploy:
	@docker image rm -f redis-proxy
	@docker build -f prod.dockerfile -t redis-proxy .
	@echo ${GREEN}"The redis-proxy image has been build. \n\
	You can start a new container using a "${YELLOW}docker run ${GREEN}" command \n\
	with environment variables for starting container with a redis-proxy server. \n\
	Or you can use "${YELLOW}"make run"${GREEN}" command for starting a container with default params \n\
	Use "${YELLOW}make remove${GREEN}" for removing the image."
run:
	@docker run --name redis-proxy -d redis-proxy
	@echo ${GREEN}"The redis-proxy server have been run with default params."
remove:
	@docker image rm -f redis-proxy
	@echo ${GREEN}"The redis-proxy container have been removed."
test:
	@docker-compose up --abort-on-container-exit --build
	@docker-compose down --rmi local
	@echo ${GREEN}"The tests have been completed successfully \n\
	For bulding an image with a redis-proxy server use "${YELLOW}make${GREEN}" command."