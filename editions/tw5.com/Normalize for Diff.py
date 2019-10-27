#[c]Quick script which normalizes a static wiki for diffing.
#[c]
#[c]The idea is to have the diff view only show the differences we want to catch and ignore irrelevant differences.
#[c]
#[c]I use it to compare static wikis generated fom different branches.
#[c]
#[c]Created with the Code Browser, it looks relatively acceptable with that editor :-)
#[c]https://github.com/heronils/Code_Browser_49
#[c]


import os

# pip install regex for super powers
from regex import compile, sub as replaceall, VERBOSE, DOTALL

old = 'output/static-output-master.html'
new = 'output/static-output-feature.html'

def norm(path):
	isnew = 'feature.html' in path
	with open(path, 'r', encoding='utf-8') as f:
		text = f.read()

#[c]	The following things were added approximately in the order i
#[c]	skimmed through the diff.

	#[of]remove some elements:remove some elements which i dont need to see in the diff
	#[of]:remove style elements
	#[c]I actually checked manually that nothing in the css code breaks. just some whitespaces are different.
	#[c]
	
	text = replaceall(r'<style\s+.+?</style>', '', text, flags=DOTALL)
	#[cf]
	#[of]:remove script elements
	text = replaceall(r'<script\s+.+?</script>', '', text, flags=DOTALL)
	#[cf]
	
	#[of]:~ remove svg elements
	#~ text = replaceall(r'<svg\s+.+?</svg>', '', text, flags=DOTALL)
	#[cf]
	#[of]remove attributes:remove attributes
	#[c]i dont need to see these in the diff
	#[c]
	text = replaceall(
		r'''
			\s+ [$a-zA-Z] (?: -? [a-zA-Z0-9]+ )*	(*PRUNE)
			\s* = \s*	(*PRUNE)
			" [^"]* "	(*PRUNE)
		''', '', text, flags=VERBOSE
	)
	#[cf]
	#[of]remove quoted attributes (only "..." values, not """...""" etc):remove quoted attributes (only "..." values, not """...""" etc)
	#[c]same here
	#[c]
	
	#[of]attributes with non-empty values:attributes with non-empty values
	text = replaceall(
		r'''
			\s+ [$a-zA-Z] (?: -? [a-zA-Z0-9]+ )*	(*PRUNE)
			\s* = \s*	(*PRUNE)
			&quot; (?!&quot;) .*? (?<!&quot;) &quot; (?!&quot;)	(*PRUNE)
		''', '', text, flags=VERBOSE|DOTALL
	)
	#[cf]
	#[of]attributes with empty values:attributes with empty values
	text = replaceall(
		r'''
			\s+ [$a-zA-Z] (?: -? [a-zA-Z0-9]+ )*	(*PRUNE)
			\s* = \s*	(*PRUNE)
			&quot; \s* &quot; (?!&quot;)	(*PRUNE)
		''', '', text, flags=VERBOSE|DOTALL
	)
	#[cf]
	#[cf]
	
	assert '"' not in text
	#[cf]

	blockelems = '(?:div|ul|ol|dl|table|tr|td|'\
	'h[1-6]|p|pre|style|blockquote)'

	#[of]remove p´s we dont want from old wiki:remove p´s we dont want from old wiki
	#[c]we can not do this using regexes because eg it will not catch (but should)
	#[c]
	#[c]<p>
	#[c]<a ...></a>
	#[c]<div></div>
	#[c]</p>
	#[c]
	#[c]so instead we write a parser so terrible, that i already nearly
	#[c]forgot how it works :-) But it works!
	#[c]
	
	if not isnew:
		#[of]:pat
		pat = compile(r'''
			(<\s*!\s*doctype\s+html\s*>)
			|
			(<''' + blockelems + r'''>)
			|
			(</''' + blockelems + r'''>)
			|
			(<''' + blockelems + r'''\s*/>)
			|
			(<img>)
			|
			(<[^<>\s]+>)
			|
			(</[^<>\s]+>)
			|
			(<[^<>\s]+\s*/>)
			|
			([^<>]+)
			|
			([<>])
		''', VERBOSE)
		#[cf]
		cleaned = ['']
		p_locations = [0]
		#[of]:handler
		def handler(match):
			nonlocal cleaned, p_locations
			doctype, bo, bc, b, v, io, ic, i, other, error = match.groups()
			#~ print((doctype, bo, bc, b, io, ic, i, other, error))
		
			if bo is not None:
				cleaned.append(bo)
				cleaned[p_locations[-1]] = ''
				if bo == '<p>':
					p_locations.append(len(cleaned)-1)
		
			elif bc is not None:
				if bc == '</p>':
					if cleaned[p_locations[-1]]:
						cleaned.append(bc)
					p_locations.pop()
				else:
					cleaned.append(bc)
		
			elif b is not None:
				cleaned[p_locations[-1]] = ''
				cleaned.append(b)
		
			elif v is not None: cleaned.append(v)
		
			elif error is not None:
				print(current[-5:])
				raise Exception(error)
		
			elif doctype is not None: cleaned.append(doctype)
			elif io is not None: cleaned.append(io)
			elif ic is not None: cleaned.append(ic)
			elif i is not None: cleaned.append(i)
			elif other is not None: cleaned.append(other)
		
			return match[0]
		#[cf]
		pat.sub(handler, text)
	
		text = ''.join(cleaned)
	
	#[c]testing that it works
	#~ with open('original.txt', 'w', encoding='utf-8') as f:
		#~ f.write(text)
	#~ with open('bad-ps-removed.txt', 'w', encoding='utf-8') as f:
		#~ f.write(''.join(cleaned))
	#~ test_manually_using_fingers()
	#[cf]
	#[of]whitespace normalizing:whitespace normalizing for block elements (cosmetic)
	#[of]'>\\s*<div' --> '>\\n<div':\\s*<div		-->		\\n<div
	text = replaceall(
		r'\s*<(' + blockelems + ')(?=[\s/>])',
		r'\n<\1',
		text
	)
	#[cf]
	#[of]'<div>\\s*...' --> '<div>\\n...':<div>\\s*...		-->		<div>\\n...
	text = replaceall(
		r'''
			(
				(?:
					<''' + blockelems + '''
					|
					"
				)
				>
			)
			\s*
		''',
		r'\1\n',
		text,
		flags=VERBOSE
	)
	#[cf]
	#[of]:\\s*</div>		-->		\\n</div>
	text = replaceall(
		r'\s*</(' + blockelems + ')>',
		r'\n</\1>',
		text
	)
	#[cf]
	#[cf]
	#[of]:remove the '\\'´s added by me
	if isnew:
		text = replaceall(
			r'&gt;\\\n',
			r'&gt;\n',
			text
		)
	#[cf]
	#[of]whitespace normalizing:whitespace normalizing for buttons (cosmetic)
	#[of]'<div>\\s*...' --> '<div>\\n...':<button>\\s*...		-->		<button>\\n...
	text = replaceall(
		r'<button>\s*',
		r'<button>\n',
		text
	)
	#[cf]
	#[cf]
	#[of]whitespace normalizing:more whitespace normalizing (cosmetic)
	#[of]'<div>\\s*...' --> '<div>\\n...':\\s*<a><span></span></a>\\s*		-->		\\n<a><span></span></a>
	text = replaceall(
		r'\s*<a>\s*<span>\s*</span>\s*</a>\s*',
		r'<a><span></span></a>\n',
		text
	)
	#[cf]
	#[cf]
	#[of]:remove empty p´s
	#[c]Those get eg. created by the navigator widget in the Tiddler
	#[c]'Creating SubStories'
	#[c]
	
	if not isnew:
		#[of]<p></p>		-->		(delete):<p>\\s*</p>		-->		(delete)
		text = replaceall(
			r'<p>\s*</p>',
			r'',
			text
		)
		#[cf]
	#[cf]
	#[of]whitespace normalizing:more whitespace normalizing (cosmetic)
	#[of]'<div>\\s*...' --> '<div>\\n...':\\n\\s*\\n		-->		\\n
	text = replaceall(
		r'\n\s*\n',
		r'\n',
		text
	)
	#[cf]
	#[of]'<div>\\s*...' --> '<div>\\n...':>\\s+<		-->		>\\n<
	text = replaceall(
		r'>\s+<',
		r'>\n<',
		text
	)
	#[cf]
	#[cf]

	someinlineelems = r'(?:code|span)'

	#[of]whitespace normalizing:more whitespace normalizing (cosmetic)
	#[of]'<div>\\s*...' --> '<div>\\n...':<inline>\\s*...		-->		<inline>...
	text = replaceall(
		r'<(' + someinlineelems + r')>\s*',
		r'<\1>',
		text
	)
	#[cf]
	#[of]'<div>\\s*...' --> '<div>\\n...':...\\s*</inline>		-->		...</inline>
	text = replaceall(
		r'\s*</(' + someinlineelems + r')>',
		r'</\1>',
		text
	)
	#[cf]
	#[of]'<div>\\s*...' --> '<div>\\n...':<select>\\s*<option>	-->		<select>\\n<option>
	text = replaceall(
		r'<select>\s*<(option|optgroup)>',
		r'<select>\n<\1>',
		text
	)
	#[cf]
	#[of]'<div>\\s*...' --> '<div>\\n...':</div>\\s+text		-->		</div> text
	text = replaceall(
		r'</div>\s+(\S)',
		r'</div> \1',
		text
	)
	#[cf]
	#[of]:<a><p><img></p></a>	-->		<a><img></a>
	#[c]
	
	text = replaceall(
		r'<a>\s*<p>\s*<img>\s*</p>\s*</a>',
		r'<a><img></a>',
		text
	)
	
	
	#[cf]
	#[cf]

	text = text.strip()
	with open(
		path.replace('.html', '-normalized.html'),
		'w',
		encoding='utf-8'
	) as f:
		f.write(text)

norm(old)
norm(new)
