Contributing
============

TiddlyWiki5 welcomes contributions to its code and documentation via [GitHub](https://github.com/Jermolene/TiddlyWiki5). Please take a moment to read these notes to help make the process as smooth as possible.

Bug Reports
-----------

From a programmers perspective, a bug report that just says "it doesn't work" is highly frustrating. For effective debugging, we need as much information as possible. At a minimum, please ensure that you include:

 * A descriptive title
 * A summary
 * Steps to reproduce
 * Expected behaviour
 * Context (OS, browser etc.)

There's a lot of good material on the web about bug reports:

http://mhay68.tumblr.com/post/1648223018/what-makes-a-good-bug-report http://www.chiark.greenend.org.uk/~sgtatham/bugs.html

Pull Requests
--------------

Like other OpenSource projects, TiddlyWiki5 needs a signed ContributorLicenseAgreement from individual contributors before contributions of code can be accepted.

 * For individuals use: [CLA-individual](https://github.com/Jermolene/TiddlyWiki5/tree/master/licenses/cla-individual.md)
 * For entities use: [CLA-individual](https://github.com/Jermolene/TiddlyWiki5/tree/master/licenses/cla-entity.md)

### How it works

```
git clone https://github.com/Jermolene/TiddlyWiki5.git TiddlyWiki5
cd TiddlyWiki5
git checkout -b sign-cla
```

**Add your name and the date to cla-individual.md or cla-entity.md**. Date format (YYYY/MM/DD)
eg: `Jermy Ruston - 2011/11/22 `

```
git add .
git commit -m "sign contributor license agreement"
git push origin sign-cla
```

**Go to your github repo and create a pull request.**

Thank you!
