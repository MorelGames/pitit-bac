install:
	cd commons && npm install
	cd back && npm install
	cd front && npm install

start-back:
	cd back && npm run back

start-back-production:
	cd back && npm run prod

watch-front:
	cd front && npm run serve

lint-front:
	cd front && npm run lint

build-front:
	cd front && npm run build
	mv front/dist front/dist-old
	mv front/dist-build front/dist
	rm -rf front/dist-old

ui:
	cd front && vue ui
