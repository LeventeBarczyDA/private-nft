build:
	cd nft && daml build
	cd nft && daml codegen js -o daml.js .daml/dist/*.dar
	cd nft && daml damlc visual .daml/dist/nft-0.0.1.dar --dot private-nft.dot
	cd nft && dot -Tpng private-nft.dot > private-nft.png
	cd ui && yarn install
	cd ui && yarn build

deploy: build
	mkdir -p deploy
	cp nft/.daml/dist/*.dar deploy
	cd ui && zip -r ../deploy/private-nft-ui.zip build

clean:
	cd nft && rm -rf .daml
	cd nft && rm -rf private-nft.dot
	cd nft && rm -rf private-nft.png
	cd nft && rm -rf daml.js
	rm -rf deploy
	cd ui && rm -rf build
	cd ui && rm -rf node_modules
	cd ui && rm -rf yarn.lock

