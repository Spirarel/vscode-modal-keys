/**
# New Vimproved ModalKeys 2.0

![](../images/pooh.jpg =375x403)
Providing full Vim emulation was not originally a goal of ModalKeys. The idea of
the extension is to provide an engine that allows the user to [map any key
combination to any command provided by VS Code](../README.html#configuration).
However, most users equate modal editing with Vim and are familiar with its
default keybindings. Vim users really love the powerful key sequences that
combine editing operations with cursor motions or text ranges.

ModalKeys has also evolved by taking inspiration from Vim. Many capabilities
were added with the motive to enable some Vim feature that was previously not
possible to implement. With version 2.0 ModalKeys's functionality is now
extensive enough to build a semi-complete Vim emulation. So, here we go...

Adding Vim keybindings as optional presets serves two purposes: it lowers the
barrier to entry for Vim users who don't want to spend the time defining
bindings from ground up. Secondly, Vim presets serve as an example to show
how you can build sophisticated command sequences using the machinery provided
by ModalKeys.

![importing presets](../images/import-preset.png =553x94)
If you are not interested on how the Vim keybindings are implemented and just
want to use them, you can skip this discussion. Just import the presets by
pressing <key>Ctrl</key>+<key>Shift</key>+<key>P</key> and running command
**ModalKeys: Import preset keybindings**. You will be presented a choice to
import either Vim bindings or any presets that you have created yourself. If
you are planning to customize the bindings, or create Vim-style commands from
scratch, this document gives you pointers how to go about with that.

## Game Plan

We start with basic motion commands which are mostly straightforward to
implement. Motions have two modes of operation: normal mode (moving cursor), and
visual mode (extending selection). We make sure all motions work correctly in
both modes. This allows us to reuse these keybindings when implementing more
advanced operations. Our goal is to avoid repetition by building complex
sequences from primitive commands.

In Vim, there are multiple key sequences for a same operation. For example,
you can convert a paragraph upper case by typing
<key>g</key><key>U</key><key>i</key><key>p</key>. You can perform the same
operation using visual mode by typing <key>v</key><key>i</key><key>p</key><key>U</key>.
The trick we use is to convert key sequences that operate on character, word,
line, paragraph, etc. to analagous key sequences that use visual mode. We can
implement all the editing commands just to work on active selection and reuse
these commands with the other key combinations. Consequently, command definition
becomes a string mapping problem. Since we can use JavaScript to expressions to
do string manipulation, these mappings are easy to formulate.

![](../images/vim-uppercase.gif)

Many ways to skin a cat...

## Motions in Normal Mode

The list of available cursor motion commands is shown below.

| Keys      | Cursor Motion
| --------- | -------------------
| `Enter`   | Beginning of next line
| `Space`   | Next character on right
| `h`       | Left
| `j`       | Down
| `k`       | Up
| `l`       | Right
| `0`       | First character on line
| `$`       | Last character on line
| `^`       | First non-blank character on line
| `g_`      | Last non-blank character on line
| `gg`      | First charater in file
| `G`       | Last character in file
| `w`       | Beginning of next word
| `e`       | End of next word
| `b`       | Beginning of previous word
| `W`       | Beginning of next alphanumeric word
| `B`       | Beginning of previous alphanumeric word
| `H`       | Top of the screen
| `M`       | Middle of the screen
| `L`       | Bottom of the screen
| `%`       | Matching bracket

Now, lets implement all the keybindings listed above.
*/
return {
    "keybindings": {
        /**
Cursor can be advanced in a file with with enter and space. These are not
technically motion commands but included for compatibility.
        */
        "\n": [
            "cursorDown",
            { "cursorMove": { "to": "wrappedLineFirstNonWhitespaceCharacter" } }
        ],
        " ": "cursorRight",
        /**
Move cursor up/down/left/right.
        */
        "::using::cursorMove": {
            "h": { to: 'left', select: '__selecting', value: '__count' },
            "j": { to: 'down', select: '__selecting', value: '__count' },
            "k": { to: 'up', select: '__selecting', value: '__count' },
            "l": { to: 'right', select: '__selecting', value: '__count' },
        },
            /**
Move to first/last character on line. These work also in visual mode.
        */
        "0": { "cursorMove": { to: 'wrappedLineStart', select: '__selecting' } },
        "$": { "cursorMove": { to: 'wrappedLineEnd', select: '__selecting' } },
        /**
Move to first/last non-blank character on line. Also these ones use the
`__selecting` flag to check whether we are in visual mode.
        */
        "^": { "cursorMove": { to: 'wrappedLineFirstNonWhitespaceCharacter', select: '__selecting' } },
        "g_": { "cursorMove": { to: 'wrappedLineLastNonWhitespaceCharacter', select: '__selecting' } },
            /**
Moving to the beginning of file is defined as a conditional command to make
it work in visual mode.
            */
        "gg": {
            "if": "__selecting",
            "then": "cursorTopSelect",
            "else": "cursorTop"
        },

    /**
<key>g</key><key>t</key> and <key>g</key><key>T</key> switch to next/previous
tab.
        */
        "gt": "workbench.action.nextEditor",
        "gT": "workbench.action.previousEditor",
        /**

Now we can complete the list of basic motion commands. This one movest the
cursor at the end of the file and selects the range, if visual mode is on.
        */
        "G": {
            "condition": "__selecting",
            "true": "cursorBottomSelect",
            "false": "cursorBottom"
        },
        /**
The logic of separating words is bit different in VS Code and Vim, so we will
not try to imitate Vim behavior here. These keys are mapped to the most similar
motion available. The <key>W</key> and <key>B</key> move past all non-space characters,
and are implemented using the search command, with appropriate options. To allow
motion across multiple words, we use the 'repeat' option.
        */
        "w": { "cursorWordStartRight": {}, "repeat": "__count" },
        "e": { "cursorWordEndRight": {}, "repeat": "__count" },
        "b": { "cursorWordStartLeft": {}, "repeat": "__count" },
        "W": {
            "modaledit.search": {
                "text": "\\W+",
                "offset": 'inclusive',
                "regex": true,
                "selectTillMatch": '__selecting',
                "highlightMatches": false,
            },
            "repeat": '__count',
        },
        "B": {
            "modaledit.search": {
                "text": "\\W+",
                "offset": 'inclusive',
                "regex": true,
                "backwards": true,
                "selectTillMatch": '__selecting',
                "highlightMatches": false,
            },
            "repeat": '__count',
        },
        /**
Moving cursor to the top, middle, and bottom of the screen is mapped to
<key>H</key> (high), <key>M</key> (middle), and <key>L</key> (low) keys.
        */
        "H": {
            "command": "cursorMove",
            "args": { to: 'viewPortTop', select: '__selecting' }
        },
        "M": {
            "command": "cursorMove",
            "args": { to: 'viewPortCenter', select: '__selecting' }
        },
        "L": {
            "command": "cursorMove",
            "args": { to: 'viewPortBottom', select: '__selecting' }
        },
        /**
Move to matching bracket command is somewhat challenging to implement
consistently in VS Code. This is due to the problem that there are no commands
that do exactly what Vim's motions do. In normal mode we call the
`jumpToBracket` command which works if the cursor is on top of a bracket, but
does not allow for the selection to be extended. In visual mode we use the
`smartSelect.expand` command instead to extend the selection to whatever
syntactic scope is above the current selection. In many cases, it is more useful
motion than jumping to a matching bracket, but using it means that we are
diverging from Vim's functionality.
        */
        "%": {
            "condition": "__selecting",
            "true": "editor.action.smartSelect.expand",
            "false": "editor.action.jumpToBracket"
        },
        /**
## Jump to a Character

Advanced cursor motions in Vim include jump to character, which is especially powerful in
connection with editing commands. With this motion, we can apply edits upto or including a
specified character. The same motions work also as jump commands in normal mode. We have to
provide separate implementations for normal and visual mode, since we need to provide
different parameters to the `modaledit.search` command we are utilizing.

| Keys          | Cursor Motion
| ------------- | ---------------------------------------------
| `f`<_char_>   | Jump to next occurrence of <_char_>
| `F`<_char_>   | Jump to previous occurrence of <_char_>
| `t`<_char_>   | Jump to character before the next occurrence of <_char_>
| `T`<_char_>   | Jump to character after the previous occurrence of <_char_>
| `;`           | Repeat previous f, t, F or T motion
| `,`           | Repeat previous f, t, F or T motion in opposite direction

All of these keybindings are implemented using the [incremental
search](../README.html#incremental-search) command, just the parameters are different for
each case. Basically we just perform either a forward or backward search and use the
"offset" option to determine where the cursor should land.
        */
        "f": {
            "modaledit.search": {
                "acceptAfter": 1,
                "offset": "inclusive",
            }
        },
        "F": {
            "modaledit.search": {
                "acceptAfter": 1,
                "backwards": true,
                "offset": "inclusive",
            }
        },
        "t": {
            "modaledit.search": {
                "acceptAfter": 1,
                "offset": "exclusive",
            }
        },
        "T": {
            "modaledit.search": {
                "acceptAfter": 1,
                "backwards": true,
                "offset": "exclusive",
            }
        },

        /**
Repeating the motions can be done simply by calling `nextMatch` or
`previousMatch`.
        */
        ";": "modaledit.nextMatch",
        ",": "modaledit.previousMatch",
        /**
         *
## Switching between Modes

Next, we define keybindings that switch between normal, insert, and visual mode:

| Keys      | Command
| --------- | --------------------------------
| `i`       | Switch to insert mode
| `I`       | Move to start of line and switch to insert mode
| `a`       | Move to next character and switch to insert mode
| `A`       | Move to end of line and switch to insert mode
| `o`       | Insert line below current line, move on it, and switch to insert mode
| `O`       | Insert line above current line, move on it, and switch to insert mode
| `v`       | Switch to visual mode
| `V`       | Select current line and switch to visual mode

These commands have more memorable names such as `i` = insert, `a` = append,
and `o` = open, but above we describe what the commands do exactly instead
of using these names.
        */
        "i": "modaledit.enterInsert",
        "I": [
            "cursorHome",
            "modaledit.enterInsert"
        ],
        /**
The `a` has to check if the cursor is at the end of line. If so, we don't move
right because that would move to next line.
        */
        "a": [
            {
                "condition": "__char == ''",
                "false": "cursorRight"
            },
            "modaledit.enterInsert"
        ],
        "A": [
            "cursorEnd",
            "modaledit.enterInsert"
        ],
        "o": [
            "editor.action.insertLineAfter",
            "modaledit.enterInsert"
        ],
        "O": [
            "editor.action.insertLineBefore",
            "modaledit.enterInsert"
        ],
        /**
Note that visual mode is not really a mode. Basically we just set the
`__selecting` flag that changes the behavior of normal mode commands. Nor is
there a separate line selection mode. We just mimic Vim's behavior using
VS Code's builtin commands that select ranges of text, when the `__selecting`
flag is on.
        */
        "v": "modaledit.toggleSelection",
        "V": [
            {
                "command": "cursorMove",
                "args": {
                    "to": "wrappedLineStart"
                }
            },
            "modaledit.toggleSelection",
            "cursorDownSelect"
        ],
        /**
## Editing in Normal Mode

Editing commands in normal mode typically either affect current character or
line, or expect a motion key sequence at the end which specifies the scope of
 the edit. Let's first define simple commands that do not require a motion
 annex:

| Keys  | Command
| ----- | -------------------------
| `x`   | Delete character under cursor
| `X`   | Delete character left of cursor (backspace)
| `r`   | Replace character under cursor (delete and switch to insert mode)
| `s`   | Substitute character under cursor (same as `r`)
| `S`   | Substitute current line (delete and switch to insert mode)
| `D`   | Delete rest of line
| `C`   | Change rest of line (delete and switch to insert mode)
| `Y`   | Yank (copy) rest of line
| `p`   | Paste contents of clipboard after cursor
| `P`   | Paste contents of clipboard at cursor
| `J`   | Join current and next line. Add space in between
| `u`   | Undo last change
| `.`   | Repeat last change

<key>x</key> and <key>X</key> commands do exactly what <key>Delete</key> and
<key>Backspace</key> keys do.
        */
        "x": "deleteRight",
        "X": "deleteLeft",
        /**
Deleting in Vim always copies the deleted text into clipboard, so we do that
as well. If you are wondering why we don't use VS Code's cut command, it has a
synchronization issue that sometimes causes the execution to advance to the
next command in the sequence before cutting is done. This leads to strange
random behavior that usually causes the whole line to disappear instead of the
rest of line.
        */
        "D": [
            "modaledit.cancelSelection",
            "cursorEndSelect",
            "editor.action.clipboardCopyAction",
            "deleteRight",
            "modaledit.cancelSelection"
        ],
        /**
Again, we utilize existing mappings to implement the <key>C</key> command. It
does same thing as keys <key>D</key><key>i</key> together.
        */
        "C": {
            "command": "modaledit.typeNormalKeys",
            "args": {
                "keys": "Di"
            }
        },
        /**
Yanking or copying is always done on selected range. So, we make sure that only
rest of line is selected before copying the range to clipboard. Afterwards we
clear the selection again.
        */
        "Y": [
            "modaledit.cancelSelection",
            "cursorEndSelect",
            "editor.action.clipboardCopyAction",
            "modaledit.cancelSelection"
        ],
        /**
Pasting text at cursor is done with <key>P</key> key. Following Vim convention
<key>p</key> pastes text after cursor position. In both cases we clear the
selection after paste, so that we don't accidently end up in visual mode.
        */
        "p": [
            "cursorRight",
            "editor.action.clipboardPasteAction",
            "modaledit.cancelSelection"
        ],
        "P": [
            "editor.action.clipboardPasteAction",
            "modaledit.cancelSelection"
        ],
        /**
<key>J</key> joins current and next lines together adding a space in between.
There is a built in command that does just this.
        */
        "J": "editor.action.joinLines",
        /**
Undoing last change is also a matter of calling built-in command. We clear the
selection afterwards.
        */
        "u": [
            "undo",
            "modaledit.cancelSelection"
        ],
        /**
The last "simple" keybinding we define is <key>`</key> that repeats the last
command that changed the text somehow. This command is provided by ModalKeys. It
checks after each key sequence is typed whether it caused a change in file.
If so, it stores the seqeuence as a change. The command just runs the stored
keysequence again.
        */
        ".": "modaledit.repeatLastChange",
        /**
## Editing with Motions

So, far we have kept the structure of keybindings quite simple. Now we tackle
the types of keybinding that work in tandem with motion commands. Examples of
such commands include:

<key>c</key><key>i</key><key>b</key> - Change text inside curly braces `{}`

<key>></key><key>G</key> - Indent rest of the file

<key>y</key><key>\`</key><key>a</key> - Yank text from cursor position to mark `a`

We can combine any editing command with any motion, which gives us thousands
of possible combinations. First type the command key and then motion which
specifies the position or range you want to apply the command to.

| Keys          | Command
| ------------- | ---------------------------
| `d`<_motion_> | Delete range specified by <_motion_>
| `c`<_motion_> | Delete range specified by <_motion_> and switch to insert mode
| `y`<_motion_> | Yank range specified by <_motion_> to clipboard
| `>`<_motion_> | Indent range specified by <_motion_>
| `<`<_motion_> | Outdent range specified by <_motion_>
| `=`<_motion_> | Reindent (reformat) range specified by <_motion_>

We can define all commands listed above in a single keybinding block. Remember
that our strategy is just to map the key sequences of the edit commands that use
motions to equivalent commands that work in visual mode. We do the specified
motion in visual mode selecting a range of text, and then running the command
on the selection. It does not matter which editing command we run, all of them
can be mapped the same way.
        */
       // TODO: implement the `operators` function
       ...operators({
        operators: {
            "d": "editor.action.clipboardCutAction",
            "y": [ "editor.action.clipboardCopyAction", "modalkeys.cancelMultipleSelections" ],
            "c": [
                "deleteRight",
                { if: "!__selection.isSingleLine", then: "editor.action.insertLineBefore" },
                "modalkeys.enterInsert"
            ],
            "<": ["editor.action.outdentLines", "modalkeys.cancelMultipleSelections" ],
            ">": ["editor.action.indentLines", "modalkeys.cancelMultipleSelections" ]
        },
        objects: {
            "w": ["modalkeys.cancelMultipleSelections", "cursorWordRightSelect"],
            "b": ["modalkeys.cancelMultipleSelections", "cursorWordLeftSelect"],
            "j": [
                "modalkeys.cancelMultipleSelections",
                {
                    "cursorMove": {
                        to: 'down',
                        by: 'wrappedLine',
                        select: true,
                        value: '__count'
                    }
                },
                "expandLineSelection",
            ],
            "k": [
                "modalkeys.cancelMultipleSelections",
                {
                    "cursorMove": {
                        to: 'up',
                        by: 'wrappedLine',
                        select: true,
                        value: '__count'
                    }
                },
                "expandLineSelection",
            ]
        }
       }),

        "d,y,c,<,>,=": {
            "id": 2,
            "help": "Edit with motion",
            /**
The motions can be also divided to two categories: repeatable and non-repeatable.
Some motions we can repeat, such as move to next character/word/line, but some
we can only do once, such as move to end of line, beginning of file, or to a
bookmark. Later on we make it possible to run repeatable motions _n_ times by
typing number _n_ before a motion command or an editing command.

We can run all editing commands on the current line by repeating the command
key. For example <key>y</key><key>y</key> yanks current line, and
<key><</key><key><</key> outdents current line. By prefixing these commands
with a number, we repeat the command _n_ times. To extract the number _n_ we
slice all but last 2 characters of the key sequence. Then we append `V` command
to it and lastly the actual editing command. The whole logic resides in the JS
expression in the `args` property below.

If you are wondering where the number prefix comes from as we don't have any
numbers in the path to our keybinding block, notice that we defined an `id` for
our block above. We can use this `id` to jump to the block from other keybinding
blocks. The entered key sequence `__cmd` contains the full sequence entered by
the user, not just immediate sequence that lead to the block. So, we can extract
the number from the start of the `__cmd` string.
            */
            "d,y,c,<,>,=": {
                "command": "modaledit.typeNormalKeys",
                "args": "{ keys: __cmd.slice(0, -2) + 'V' + (__rcmd[0] =='c' ? 'dO' : __rcmd[0]) }"
            },
            /**
Another thing to note is that we actually have some logic when choosing what
command to run; we transform the <key>c</key> key to <key>d</key><key>O</key>
sequence, which deletes the selected range and then inserts a new line above
cursor. As an example command <key>2</key><key>c</key><key>c</key> actually
maps to command <key>2</key><key>V</key><key>d</key><key>O</key>.

All the other repeatable commands can be defined in almost identical way. For
example the command to yank three words <key>3</key><key>y</key><key>w</key> is
converted to a sequence <key>v</key><key>3</key><key>w</key><key>y</key>.
            */
            "h,j,k,l,w,e,b,W,B,%": {
                "command": "modaledit.typeNormalKeys",
                "args": "{ keys: 'v' + __cmd.slice(0, -2) + __rcmd[0] + __rcmd[1] }"
            },
            /**
Non-repeatable motions are even easier. We just basically rearrange the key
sequence and add <key>v</key> key in front.
            */
            "^,$,0,G,H,M,L": {
                "command": "modaledit.typeNormalKeys",
                "args": "{ keys: 'v' + __rcmd[0] + __rcmd[1] }"
            },
            "g": {
                "g,_": {
                    "command": "modaledit.typeNormalKeys",
                    "args": "{ keys: 'v' + __rcmd[1] + __rcmd[0] + __rcmd[2] }"
                }
            },
            /**
Next motions jump to a character. They are handy when you want to edit text
until a specified character. For example the command
<key>d</key><key>t</key><key>"</key> deletes text until the next quotation mark.
The implementation is exactly same as above, so the command would map to key
sequence <key>v</key><key>t</key><key>"</key><key>d</key>.
            */
            "f,t,F,T": {
                "help": "Do until _",
                " -~": {
                    "command": "modaledit.typeNormalKeys",
                    "args": "{ keys: 'v' + __rcmd[1] + __rcmd[0] + __rcmd[2] }"
                }
            },
            /**
Doing an edit inside set of delimiters like braces, parenthesis or quotation
marks can be done with the <key>a</key> or <key>i</key> movement. The difference
between them is that <key>a</key> includes the delimiters in the edit whereas
<key>i</key> does not. The desired delimiter is the last key in the sequence.
Special delimiters <key>w</key>, <key>p</key>, <key>b</key>, <key>B</key>, and
<key>t</key> apply the edit inside word, paragraph, parenthesis, curly braces,
and angle brackets respectively.
            */
            "a,i": {
                "help": "Do around/inside _",
                "w,p,b,B,t, -/,:-@,[-`,{-~": {
                    "command": "modaledit.typeNormalKeys",
                    "args": "{ keys: 'v' + __rcmd[1] + __rcmd[0] + __rcmd[2] }"
                }
            },
            /**
The last motion you can combine with editing commands is jump to tag. It is
convenient when you want to edit long ranges of text that can't fit on screen.
We have two variants of the motion: <key>`</key> edits until the exact mark
location, <key>'</key> until the beginning of line where the mark specified as
the last key resides. Key sequence is rearranged exactly as above.
            */
            "`,'": {
                "help": "Do until mark _",
                "a-z": {
                    "command": "modaledit.typeNormalKeys",
                    "args": "{ keys: 'v' + __rcmd[1] + __rcmd[0] + __rcmd[2] }"
                }
            }
        },
        /**
## Commands Prefixed by Number

As stated above, you can repeat many motions and edit commands by prefixing
them with number(s). All of the repeatable commands are listed below. We use a
[recursive keymap](../README.html#defining-recursive-keymaps) that loops in the
same mapping while you type number keys. After you type letter(s), we invoke the
command designated by the letters <_num_> times, or perform a jump command to
line <_num_>.

| Keys                          | Command
| ----------------------------- | -----------------------------------
| <_num_>`h|j|k|l|w|e|b|W|B|%`  | Repeat motion <_num_> times
| <_num_>`u`                    | Undo <_num_> times
| <_num_>`v|V`                  | Select <_num_> characters/lines
| <_num_>`s|S`                  | Substitute (replace) <_num_> characters/lines
| <_num_>`J`                    | Join <_num_> lines
| <_num_>`gJ`                   | Join <_num_> lines without space in between
| <_num_>`G|gg`                 | Jump to line <_num_>
| <_num_>`gu`<_motion_>         | Convert the range specified by <_motion_> repeated <_num_> times to lowercase
| <_num_>`gU`<_motion_>         | Convert the range specified by <_motion_> repeated <_num_> times to uppercase
| <_num_>`d`<_motion_>          | Delete the range specified by <_motion_> repeated <_num_> times
| <_num_>`c`<_motion_>          | Change the range specified by <_motion_> repeated <_num_> times
| <_num_>`y`<_motion_>          | Yank the range specified by <_motion_> repeated <_num_> times
| <_num_>`>`<_motion_>          | Indent the range specified by <_motion_> repeated <_num_> times
| <_num_>`<`<_motion_>          | Outdent the range specified by <_motion_> repeated <_num_> times
| <_num_>`=`<_motion_>          | Reformat the range specified by <_motion_> repeated <_num_> times

The recursive part of the keymap defined below.
        */
        "1-9": {
            "id": 3,
            "help": "Repeat / go to line",
            "0-9": 3,
            /**
If any of the repeatable motions is typed after a number, we just do that motion
<_num_> times. The `parseInt` function extracts the number from the beginning of
the key sequence.
            */
            "h,j,k,l,w,e,b,W,B,u,%": {
                "command": "modaledit.typeNormalKeys",
                "args": "{ keys: __rcmd[0] }",
                "repeat": "parseInt(__cmd)"
            },
            /**
Repeating <key>v</key> or <key>V</key> command will select <_num_> characters or
lines.
            */
            "v": {
                "command": "cursorRightSelect",
                "repeat": "parseInt(__cmd)"
            },
            "V": {
                "command": "expandLineSelection",
                "repeat": "parseInt(__cmd)"
            },
            /**
Also substitution commands can be repeated. In this case we just remap the
key sequence with the parsed number in front.
            */
            "s": {
                "command": "modaledit.typeNormalKeys",
                "args": "{ keys: parseInt(__cmd) + 'vc' }"
            },
            "S": {
                "command": "modaledit.typeNormalKeys",
                "args": "{ keys: parseInt(__cmd) + 'cc' }"
            },
            /**
We can join multiple lines at once, too. This works because the
`editor.action.joinLines` joins all selected lines. We just have to clear the
selection afterwards.
            */
            "J": [
                {
                    "command": "modaledit.typeNormalKeys",
                    "args": "{ keys: parseInt(__cmd) + 'VJ' }"
                },
                "modaledit.cancelSelection"
            ],
            /**
Jumping to a line in Vim is also done by entering first a number and then eiter
<key>G</key> or <key>g</key><key>g</key>. The first keybinding we actually
implement, and the second one just remaps to the first one. Implementing jump
to line in VS Code requires two commands
            */
            "G": [
                {
                    "command": "revealLine",
                    "args": "{ lineNumber: parseInt(__cmd) - 1, at: 'top' }"
                },
                {
                    "command": "cursorMove",
                    "args": {
                        "to": "viewPortTop"
                    }
                }
            ],
            "g": {
                "g": {
                    "command": "modaledit.typeNormalKeys",
                    "args": "{ keys: parseInt(__cmd) + 'G' }"
                },
                /**
Joining lines without space in between is implemented by repeating the command.
                */
                "J": {
                    "command": "modaledit.typeNormalKeys",
                    "args": "{ keys: __cmd.slice(-2) }",
                    "repeat": "parseInt(__cmd)"
                },
                /**
Repeating the complex editing commands is just a matter of jumping to their
keymap blocks. If <key>u</key> or <key>U</key> is pressed we jump to block `1`.
The rest of the editing commands are implemented in block `2`.
*/
                "u,U": 1
            },
            "d,c,y,<,>,=": 2
        },
        /**
## Searching

Searching introduces a pseudo-mode that captures the keyboard and suspends other
commands as long as search is on. Searching commands are shown below.

| Keys      | Command
| --------- | --------------------
| `/`       | Start case-sensitive search forwards
| `?`       | Start case-sensitive search backwards
| `n`       | Select the next match
| `p`       | Select the previous match

**Note**: Searching commands work also with multiple cursors. As in Vim, search
wraps around if top or bottom of file is encountered.
        */
        "/": [
            {
                "command": "modaledit.search",
                "args": {
                    "caseSensitive": true,
                    "wrapAround": true
                }
            }
        ],
        "?": {
            "command": "modaledit.search",
            "args": {
                "backwards": true,
                "caseSensitive": true,
                "wrapAround": true
            }
        },
        "n": "modaledit.nextMatch",
        "N": "modaledit.previousMatch",
        /**
## Miscellaneous Commands

Rest of the normal mode commands are not motion or editing commands, but do
miscellaenous things.

| Keys      | Command
| --------- | ---------------------------------
| `:`       | Show command menu (same as <key>Ctrl</key><key>Shift</key><key>P</key>)
| `zz`      | Center cursor on screen
| `ZZ`      | Save file and close the current editor (tab)
| `ZQ`      | Close the current editor without saving

Note that <key>Z</key><key>Q</key> command still asks to save the file, if
it has been changed. There is no way to get around this in VS Code.
        */
        ":": "workbench.action.showCommands",
        "z": {
            "z": {
                "command": "revealLine",
                "args": "{ lineNumber: __line, at: 'center' }"
            }
        },
        "Z": {
            "help": "Z - Close and save, Q - Close without saving",
            "Z": [
                "workbench.action.files.save",
                "workbench.action.closeActiveEditor"
            ],
            "Q": "workbench.action.closeActiveEditor"
        }
    },
    /**
## Motions in Visual Mode

ModalKeys 2.0 adds a new configuration section called `selectbidings` that has
the same structure as the `keybindings` section. With it you can now map keys
that act as the lead key of a normal mode sequence to run a commands when
pressed in visual mode. For example keys <key>d</key>, <key>c</key>, and
<key>y</key> work this way. In normal mode they must be followed by a motion
command to specify the range that they are applied, but in visual mode they
run on the selected text.

`selectbindings` section is always checked first when ModalKeys looks for a
mapping for a keypress. If there is no binding defined in `selectbindings`
then it checks the `keybindings` section. Note that you can still define normal
mode commands that work differently when selection is active. You can use either
a conditional or parameterized command to check the `__selecting` flag, and
perform a different action based on that.

We define all the motions that do not yet work correctly in visual mode. The
full list is below:

| Keys              | Command
| ----------------- | -----------------------------------------
| `h|j|k|l`         | Select text to left/down/up/right
| `w`               | Select until beginning of next word
| `e`               | Select until end of word
| `b`               | Select until beginning of previous word
| `W`               | Select until beginning of next alphanumeric word
| `B`               | Select unting beginning of previous alphanumeric word
| `f`<_char_>       | Select until next occurrence of <_char_> including it
| `F`<_char_>       | Select until previous occurrence of <_char_> including it
| `t`<_char_>       | Select until next occurrence of <_char_> but not including it
| `T`<_char_>       | Select until previous occurrence of <_char_> but not including it
| `a`<_char_>       | Select text inside <_char_> including it
| `i`<_char_>       | Select text inside <_char_> but not including it
| `aw`              | Select current word including the whitespace around it
| `iw`              | Select current word not including the whitespace around it
| `ap`              | Select current paragraph including the whitespace around it
| `ip`              | Select current paragraph not including the whitespace around it
| `a( | a) | ab`    | Select text inside parenthesis including them
| `i( | i) | ib`    | Select text inside parenthesis not including them
| `a{ | a} | aB`    | Select text inside curly braces including them
| `i{ | i} | iB`    | Select text inside curly braces not including them
| `a[ | a]`         | Select text inside brackets including them
| `i[ | i]`         | Select text inside brackets not including them
| `a< | a> | at`    | Select text inside ange brackets (tag) including them
| `i[ | i] | at`    | Select text inside angle brackets (tag) not including them

The basic movement commands are otherwise identical to normal mode defintions,
but the actual commands invoked are different. Roughly speaking, we just add
`Select` at the end of each command.
    */
    "selectbindings": {
        "l": "cursorRightSelect",
        "h": "cursorLeftSelect",
        "j": "cursorDownSelect",
        "k": "cursorUpSelect",
        "w": "cursorWordStartRightSelect",
        "e": "cursorWordEndRightSelect",
        "b": "cursorWordStartLeftSelect",
        "W": {
            "command": "cursorWordStartRightSelect",
            "repeat": "__char.match(/\\W/)"
        },
        "B": {
            "command": "cursorWordStartLeftSelect",
            "repeat": "__char.match(/\\W/)"
        },
        /**
Selecting forwards/backwards until a character is found can be implemented with
the `modaledit.search` command as in normal mode. The difference is in what
parameters we use; we include the `selectTillMatch` flag, and provide different
`typeBefore...` and `typeAfter...` key sequences.
        */
        "f": {
            "command": "modaledit.search",
            "args": {
                "acceptAfter": 1,
                "selectTillMatch": true
            }
        },
        "F": {
            "command": "modaledit.search",
            "args": {
                "acceptAfter": 1,
                "backwards": true,
                "selectTillMatch": true
            }
        },
        "t": {
            "command": "modaledit.search",
            "args": {
                "acceptAfter": 1,
                "typeAfterAccept": "h",
                "typeBeforeNextMatch": "l",
                "typeAfterNextMatch": "h",
                "typeBeforePreviousMatch": "h",
                "typeAfterPreviousMatch": "l",
                "selectTillMatch": true
            }
        },
        "T": {
            "command": "modaledit.search",
            "args": {
                "acceptAfter": 1,
                "backwards": true,
                "typeAfterAccept": "l",
                "typeBeforeNextMatch": "h",
                "typeAfterNextMatch": "l",
                "typeBeforePreviousMatch": "l",
                "typeAfterPreviousMatch": "h",
                "selectTillMatch": true
            }
        },
        /**
Selecting text inside/around delimiters are motions that are only defined in
visual mode. The motions can be used along with editing commands in normal mode,
but obviously cannot be performed by themselves as they select ranges of text
thus entering visual mode automatically.

All variants of these motions are implemented with the
[`modaledit.selectBetween` command](../README.html#selecting-text-between-delimiters).
The command takes start and end delimiters, which can be also regular
expressions, and selects the range between these delimiters. The scope of the
search is by default the current line, but for some variants we specify the
`docScope` parameter which causes the search to consider the whole file.
        */
        "a,i": {
            "help": "Select around/inside _",
            "w": [
                {
                    "command": "modaledit.selectBetween",
                    "args": "{ from: '\\\\W', to: '\\\\W', regex: true, inclusive: __rcmd[1] == 'a' }"
                }
            ],
            "p": [
                {
                    "command": "modaledit.selectBetween",
                    "args": "{ from: '(?<=\\\\r?\\\\n)\\\\s*\\\\r?\\\\n', to: '(?<=\\\\r?\\\\n)\\\\s*\\\\r?\\\\n', regex: true, inclusive: __rcmd[1] == 'a', docScope: true }"
                }
            ],
            " -/,:-@,[-`,{-~": [
                {
                    "command": "modaledit.selectBetween",
                    "args": "{ from: __rcmd[0], to: __rcmd[0], inclusive: __rcmd[1] == 'a' }"
                }
            ],
            "(,),b": [
                {
                    "command": "modaledit.selectBetween",
                    "args": "{ from: '(', to: ')', inclusive: __rcmd[1] == 'a', docScope: true }"
                }
            ],
            "{,},B": [
                {
                    "command": "modaledit.selectBetween",
                    "args": "{ from: '{', to: '}', inclusive: __rcmd[1] == 'a', docScope: true }"
                }
            ],
            "[,]": [
                {
                    "command": "modaledit.selectBetween",
                    "args": "{ from: '[', to: ']', inclusive: __rcmd[1] == 'a', docScope: true }"
                }
            ],
            "<,>,t": [
                {
                    "command": "modaledit.selectBetween",
                    "args": "{ from: '<', to: '>', inclusive: __rcmd[1] == 'a' }"
                }
            ]
        },
        /**
## Editing Commands in Visual Mode

The last pieces of puzzle are editing commands that operate on selected text in
visual mode. They are the same editing operations we already defined in normal
mode, but remarkable simpler in this context. Since VS Code's operations already
work on selected text, we only need to call the built-in commands and clear the
selection afterwards.

| Keys      | Command
| --------- | -------------------------
| `>`       | Indent selection
| `<`       | Outdent selection
| `=`       | Reindent (reformat) selection
| `d | x`   | Delete (cut) selection
| `c`       | Change selection (cut and enter insert mode)
| `y`       | Yank (copy) selection
| `u`       | Transorm selection to lowercase
| `U`       | Transorm selection to upppercase

Here are the implementations.
        */
        ">": [
            "editor.action.indentLines",
            "modaledit.cancelSelection"
        ],
        "<": [
            "editor.action.outdentLines",
            "modaledit.cancelSelection"
        ],
        "=": [
            "editor.action.formatSelection",
            "modaledit.cancelSelection"
        ],
        "d,x": [
            "editor.action.clipboardCopyAction",
            "deleteRight",
            "modaledit.cancelSelection"
        ],
        "c": [
            "editor.action.clipboardCopyAction",
            "deleteRight",
            "modaledit.enterInsert"
        ],
        "y": [
            "editor.action.clipboardCopyAction",
            "modaledit.cancelSelection"
        ],
        "u": [
            "editor.action.transformToLowercase",
            "modaledit.cancelSelection"
        ],
        "U": [
            "editor.action.transformToUppercase",
            "modaledit.cancelSelection"
        ]
    }
}
/**
## Conclusion

The list of commands we provided is by no means exhaustive but still contains
literally thousands of key combinations that cover the most commonly used Vim
operations. This is quite a nice achievement considering that we only wrote
about 600 lines of configuration, and most of it is pretty trivial. This
demonstrates that ModalKeys's functionality is powerful enough to build all
kinds of operations that make modal editors like Vim popular.
*/