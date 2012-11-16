#!/bin/sh
#
# this hack pulls down the wikis for each bag, splitting the wiki into tiddlers using ginsu
# long term plan is to use the "fat" JSON for a bag
#

set -e
export space
export dir

mkdir -p tmp

for space in tiddlywiki-com-ref tiddlywiki-com
do
	mkdir -p $space

	dir=tmp/${space}.html.0
	curl -s http://${space}.tiddlyspace.com/bags/${space}_public/tiddlers.wiki > tmp/$space.html

	# clear out the space directory so we can see deleted files when we commit
	rm -f $space/*

	# backup any existing exploded content
	mkdir -p backups
	[ -d $dir ] && mv $dir backups/$$

	# split into tiddlers
	(
		cd tmp
		ginsu $space > /dev/null
	)

	# convert .tiddler files into .tid files
	(
		cd "$dir"

		tiddler2tid *.tiddler
		find . -name \*.tid -o -name \*.js -o -name \*.meta |
			while read file
			do
				sed -e '/^server.*: /d' -e '/^_hash:/d' < "$file" > "../../$space/$file"
			done
	)

	# make recipe based on files in the space directory
	(
		cd $space

		find . -name \*.tid -o -name \*.js |
			grep -v '\.jpg\.' |
			grep -v 'PageTemplate' |
			grep -v 'SplashScreen' |
			grep -v 'SiteSubtitle' |
			sed 's/^/tiddler: /' > split.recipe
	)
done

cook $PWD/index.html.recipe
