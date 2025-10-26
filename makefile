.PHONY: help
help: makefile
	@tail -n +4 makefile | grep ".PHONY"


.PHONY: lint
lint:
	bunx eslint --max-warnings=0 --ignore-pattern=.gitignore .


.PHONY: test
test: lint
	bun test/index.js


.PHONY: install
install:
	bun link


.PHONY: clean
clean:
	rm -rf node_modules
