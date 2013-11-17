@echo

rem Publish to NPM

npm publish || exit 1

rem Deploy latest build to github

pushd ..\mytiddlywiki.github.com

git add --all || exit 1

git commit -m "Updates" || exit 1

git push origin || exit 1

popd
