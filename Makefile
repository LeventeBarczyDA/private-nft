build:
	cd nft && daml build
	cd nft && daml codegen js -o daml.js .daml/dist/*.dar
	cd ui && yarn install
	cd ui && yarn build

deploy: build
	mkdir -p deploy
	cp nft/.daml/dist/*.dar deploy

clean:
	cd nft && rm -rf .daml
	cd nft && rm -rf daml.js
	rm -rf deploy
	cd ui && rm -rf build
	cd ui && rm -rf node_modules
	cd ui && rm -rf yarn.lock

