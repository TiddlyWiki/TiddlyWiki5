# Start at a Makefile or managing build activities.
# Expects a 'cook' script somewhere on the $PATH.
# See 'cook' in this directory for a sample you can use.
# For now users the OSX specific "open" to run a test file. This
# will need to change.
#

clean:
	rm *.html || true
	rm *.jar || true
	rm *.js || true


test: clean tests.html
	ln -sf test/recipes/sample.txt .
	open tests.html

tests.html:
	cook $(PWD)/test/recipes/tests.html.recipe tests.html

alpha:
	./bldalpha
