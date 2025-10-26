.PHONY: help
help: makefile
	@tail -n +4 makefile | grep ".PHONY"


.PHONY: lint
lint:
	bunx eslint --max-warnings=0 --ignore-pattern=.gitignore .


.PHONY: test
test: lint
	bunx tsc --noEmit
	bun test/index.js


.PHONY: build
build:
	bunx tsc


.PHONY: install
install: test
	bun link


.PHONY: clean
clean:
	rm -rf node_modules
