---
created: 20240512202422824
deferredFiletype: bin/test-tiddler
desc: ''
id: vouch037emrmt5a3eugh7jm
modified: 20240520160136893
tags: test-defer
title: misc.card-and-board-games.gridcannon
type: text/markdown
updated: 1648720082424
---
# An example markdown file

Below is an example taken from my (CyberFoxar's) notes. It's the rules from a card game called gridcannon, feel free to read it if you want, here it's merely placeholder text.


## [Gridcannon: A Single Player Game With Regular Playing Cards](https://www.pentadact.com/2019-08-20-gridcannon-a-single-player-game-with-regular-playing-cards/)

I thought it would be an interesting game design challenge to come up with a single player game you can play with a regular deck of playing cards. My first try, about a month ago, didn’t work. But on Sunday I had a new idea, and with one tweak from me and another from my friend [Chris Thursten](https://twitter.com/CThursten), it’s playing pretty well now! In the video I both explain it and play a full game. I’ll write the rules here, but they’ll make more sense when you see it played:

<iframe src="https://www.youtube.com/embed/gqmUpQjFHrA" allowfullscreen="allowfullscreen" width="560" height="315" frameborder="0"></iframe>

If you’re following closely, you might notice I slip up and fail to kill the king of clubs when he should have died, but I re-kill him with the next play so it’s fine. I was tired.

**Update:** Since making the video I’ve tweaked the rules a bit, so I’ll lay out the rules for the revised version here. If you’re curious about the evolution, I’ll also include the old post and its update below that.

#### Version 2

##### Setup

1.  Start with a shuffled deck, including jokers.
2.  With the deck face-down, draw cards from the top and lay them out face-up in a 3×3 grid. If you draw any royals, aces or jokers during this, put them on a separate pile and keep drawing til you’ve made the grid of just number cards.
3.  If you did draw some royals, you now place them the same way we will when playing: put it _outside_ the grid, adjacent to the grid card it’s most similar to. ‘Most similar’ means:
    1.  Highest value card of the same suit
    2.  If none, highest value card of the same colour
    3.  If none, highest value card
    4.  If there’s a tie, or most similar card is on a corner, you can choose between the equally valid positions
4.  Any aces and jokers you drew during set up, keep them face-up to one side. These are Ploys you can play whenever you like, rules below.
5.  Once you have a 3×3 grid of number cards, you may choose one to replace if you like: put it on the bottom of the draw pile and draw a new card to replace it.

##### The Goal

Find and kill all the royals.

##### Play

Draw the top card from the deck.

-   **If it’s a royal:** use placement rule above.
-   **If it has value 2-10:** you must place it on the grid. It can go on any card with the same or lower value, regardless of suit.
-   **If it’s an ace or joker:** keep it to one side, see **Ploys**.

**Killing royals:** if you’re able to place a card on the grid opposite a royal – so there are two cards between – those two cards **Attack** the royal. The sum of their values must be at least as much as health of the royal to kill them: if it’s not, you can still place the card, but the royal is unaffected. The value of the card you just placed is not part of the Attack, only the two between.

-   **Jacks:** 11 health. The cards Attacking can be any suit.
-   **Queens:** 12 health. The cards Attacking must match the colour of the queen to count.
-   **Kings:** 13 health. The cards Attacking must match the suit of the king to count.

If you killed the royal, turn it face down but don’t remove it – new royals you draw still can’t be placed in that spot. Once every spot around the grid has a dead royal in it (12 total) you’ve won.

**Ploys**:

-   **Aces are Extractions:** at any time you can use up one of the aces you’ve drawn to pick up one stack of cards from the grid and put them face-down at the bottom of your draw pile. You can do this even after drawing a card and before placing it. Turn the ace face-down to remember you’ve used it.
-   **Jokers are Reassignments:** at any time you can use up one you’ve drawn to move the top card of one stack on the grid to another position. The place you move it to must be a valid spot to play the card, and placing it can trigger an Attack the same way a normal play can. Turn the joker face-down to remember you’ve used it.

**If you cannot place a card:** and you have no Ploys to use, you must add the card as **Armour** to the royal it’s most similar to (lowest value royal of same suit, failing that lowest of same colour, etc). It increases their health by the value of the card. So a King with a 3 as armour now has 13 + 3 = 16 health. You can add armour to a royal that already has armour – it stacks. If a royal ends up with 20+ health (or 19+ for a King), that’s a natural loss as there’s no longer any way to kill them. (Credit to Chris Thursten for the armour idea!)

**If there are no living royals on the table:** if every spot around the grid has a dead royal on it – all 12 – you’ve won! If not, just keep drawing cards until you find a royal, placing the cards in a face-up pile as you go. Once you find a royal, place it, then add the cards you cycled through to the bottom of your deck.

**If the draw pile runs out:** and you haven’t killed all the royals, use any ploys you have left to fix the situation if you can. If you’re out of both cards and ploys and not all royals are dead, you’ve lost.

##### Scoring

If you’ve killed all the royals without running out of cards, your score is how many Ploys you have left unspent. So the maximum score is 6.

If you play it, let me know how it goes in the replies to [this tweet](https://twitter.com/Pentadact/status/1163905286375170048)!

–

##### If you’d like to make/release/sell a game based on this

Please do! I’d suggest saying “Based on Gridcannon by Tom Francis” somewhere in the credits – a link to this post would be cool if possible.

I’d also suggest not calling it just ‘Gridcannon’, but it’s fine to use that word in the title.

If you’re going to charge for it, maybe think about if there’s something you’d like to add to the game. Could just be theme/art/flash, or perhaps a mechanics change? Do you have a better idea for scoring it? Should Jokers do something different? This is just a quick prototype, it has lots room for improvement. And digital versions let you do things I couldn’t with cards – prevent bad deals, know which stacks have resets, start with a more specific grid setup, reward achievements…

Also a heads up that a nearly complete digital version is up, free, and playable in browser [here](https://herebemike.github.io/Gridcannon/site/) by [@HereBeMike](https://twitter.com/HereBeMike).

–

#### Old Version

##### Setup

1.  Start with a shuffled deck, including jokers.
2.  With the deck face-down, draw cards and lay out a 3×3 grid, skipping the center position. If you draw any royals during this, put them on a separate pile instead and keep drawing til you’ve made the grid without royals
3.  If you did draw some royals, you now place them the same way we will when playing: put it _outside_ the grid, adjacent to the grid card it’s most similar to. That means highest value card of the same suit. If none match suit, highest of same colour. If none match colour, highest value. If still tied, you can choose. If the card most like the royal is on a corner, you can choose which side to put it.

**Goal: Find and kill all royals**

##### Play

Draw a card from the deck.

-   **If it’s a royal:** use placement rule above.
-   **If it has value 2-10:** you must place it on the grid. It can go on any card with the same or lower value. Empty spots and jokers have value zero, aces have value 1.
-   **If it’s an ace or joker:** these can be played on top of anything, and doing so ‘Resets’ that stack: pick up the stack and add it to the bottom of the deck. Now place your ace or joker where it was.

**Killing royals:** if you’re able to place a card on the grid opposite a royal – so there are two cards between – those two cards become a ‘payload’ that you are firing at the royal. The sum of their values is the power of the shot. The power of the shot must be as much or greater than the health of the royal to kill it – if it’s not, it does nothing.

-   **Jacks:** 11 health. The cards in the payload can be any suit.
-   **Queens:** 12 health. The cards in the payload must match the colour of the queen to count.
-   **Kings:** 13 health. The cards in the payload must match the suit of the king to count.

**If you cannot place a card:** you have two options:

-   **Hard Reset:** put the card in your ‘shame pile’, and Reset any stack of your choice (pick it up, the space becomes blank). Your shame pile is a negative score – your goal is to keep it as small as possible.
-   **Add Armour:** the card you can’t play is added to the royal it’s most similar to (lowest value royal of same suit) and increases their health by that much. So a King with a 3 as armour now has 13 + 3 = 16 health.

In both cases, the card you can’t play never returns to the deck or the grid.

**If you run out of cards in your deck:** choose a stack. Put its top card on your Shame Pile, and take the rest as your new deck.

**If there are no living royals in play:** if all 12 are dead, you’ve won. If not, draw cards until you find a royal, placing these in a face-up pile as you go. Once you find a royal, place it, then add the cards you cycled through to the bottom of your deck.

–

The ‘Add Armour’ option was Chris’s idea, and if you’re curious, leaving the middle space blank is the one I added after the initial design – without that, you can get really screwed by unlucky deals.

Personally, I’m still tinkering with some of the rules for a possible next version, and my friend Mike Cook (different Mike) had a great idea for a possible different theme.

##### Revisions To Old Version

I’m testing out a new version of the rules to fix a few problems. Give it a try and tell me what you think!

**Problem 1: Remembering resets.** If you remember where you put your resets, you can get them back with your next reset and the deck lasts forever. If you can’t, it runs out, to great cost. This is fiddly and puts too much emphasis on memory – I don’t enjoy that kind of challenge and I don’t want the game to be inaccessible to those who can’t remember that stuff.

**Problem 2: The Shame Pile.** A lot of people have trouble understanding this concept or just don’t like it. A negative score system is unusual, and it also doesn’t feel great – ‘winning’ with shame is a bit of a mixed feeling.

**Problem 3: Too easy.** Some are finding it too easy to finish with no shame.

So the changes I’m leaning towards are:

**Storing Aces:** When you draw an ace, put it face-up to one side. At any time, you can spend any of your aces from this Stash to pick up any stack – including after you draw a card but before you place it. When you use an ace, just turn it face down to remember it’s used – it doesn’t go in your deck.

**Jokers:** When you draw a joker, also add it to your Stash. At any time, you can spend it to move a card that’s already on the grid. You can only move it to a valid place to play it. You only move the top card, not the whole stack. As with aces, you just turn the joker over, it stays in your stash.

**Scoring:** If you win, your unspent Jokers and Aces are your score. So a perfect game is 6, if you won without using any.

**Failure:** When the deck runs out, if you haven’t won and you don’t have any unspent aces to get more cards with, the game is over. If you draw a card you can’t play, and you can’t add it as armour without making a royal invincible, and you don’t have an ace or joker to get out of it, that’s also game over. I’ve never had that scenario yet.

**Setup:** You now lay out a full 3×3 grid, don’t skip the middle space, but after placing royals, you can take any 1 grid card, add it to the bottom of your deck, and draw a new card to replace it.

In my playtests this version feels like it gives you a lot more to think about, and more control over your success, which is why I’m ok with allowing a hard failure state. I’m not sure about overall difficulty yet – so far I’ve never come close to a perfect game, usually scraping through with 2, 1, or 0 special cards unspent. For me it’s been rare to fail, and always felt like my fault.

That setup change is a bit of a tangent, I just found it aesthetically messy that you start with this blank spot and I had to explain to people that it was a valid spot and what you could play there, etc. I think the new way still gives you decent bad-deal mitigation, and it gives you 2 more chances to draw an ace, joker, or royal early, all of which are advantageous in this version, but probably makes the game harder than the blank-spot system.

If you play, please let me know how you find it! Did you ever have a failure that didn’t feel like you could have avoided it? Are you getting perfect games too easily? Reply to [this tweet](https://twitter.com/Pentadact/status/1173287612985032711) or e-mail [tom@pentadact.com](mailto:tom@pentadact.com).
