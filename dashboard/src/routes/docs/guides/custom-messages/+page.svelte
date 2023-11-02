<script lang="ts">
    import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import P from "$lib/components/P.svelte";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Documentation</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Custom Messages</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs/guides", "Guides"],
            ["/docs/guides/custom-messages", "Custom Messages"],
        ]}
    />
    <h2 class="h2">Custom Messages</h2>
    <P>
        Custom messages allow you to configure your own text to send to users for things such as supporter announcements or welcome messages. They are also used
        for stats channels. In addition to writing static text, you can also set up dynamic text that changes depending on certain variables.
    </P>
    <P>This guide goes over the mechanics of dynamic custom messages and not how to write a good one; that is up to your personal style.</P>
    <h2 class="h2">Basic Format</h2>
    <P>
        The basic format for dynamic custom messages is to simply insert a command block into the message using <code class="code">{"{...}"}</code>.
    </P>
    <P>For example, to mention the user in a welcome message, simply do <code class="code">{"{mention}"}</code>.</P>
    <P>
        There are also commands that take and manipulate other values. For example, to show "you are the Nth member", you can do
        <code class="code">{"{ordinal {members}}"}</code> to get the "Nth". Here, <code class="code">ordinal</code> is a function that takes a number and
        returns the ordinal format ("Nth") for it, and <code class="code">members</code> is a function that returns the number of members in the server at the time.
    </P>
    <P>To insert a literal <code class="code">{"{"}</code>, just write <code class="code">\{"{"}</code>.</P>
    <h2 class="h2">Members</h2>
    <P>If the context targets a server member (e.g. welcome messages), the following are available:</P>
    <ul class="list-disc pl-4">
        <li class="pl-2"><code class="code">{"{avatar}"}</code>: the user's server-specific avatar if present, their user avatar otherwise</li>
        <li class="pl-2"><code class="code">{"{nickname}"}</code>: the member's nickname if they have one and their display name othewise</li>
        <li class="pl-2"><code class="code">{"{booster?}"}</code>: whether or not the member is boosting the server</li>
    </ul>
    <h2 class="h2">Members &amp; Users</h2>
    <P>If the context targets a server member (e.g. welcome messages) or a user, the following are available:</P>
    <ul class="list-disc pl-4">
        <li class="pl-2">
            <code class="code">{"{mention}"}</code>: mention the user &mdash; note that this only pings if in the message content and not in an embed
        </li>
        <li class="pl-2"><code class="code">{"{display-name}"}</code>: the user's display name</li>
        <li class="pl-2"><code class="code">{"{username}"}</code>: the user's username</li>
        <li class="pl-2">
            <code class="code">{"{tag}"}</code>: the user's tag, which is their username in the new system and <code class="code">username#NNNN</code> in the old
            system
        </li>
        <li class="pl-2">
            <code class="code">{"{discriminator}"}</code>: the user's discriminator, which is <code class="code">"0"</code> in the new system and the four numbers
            at the end of their tag in the old system (as a string)
        </li>
        <li class="pl-2">
            <code class="code">{"{banner}"}</code>: the user's banner URL (unfortunately, there is no way to get a member's server-specific banner for some
            reason)
        </li>
        <li class="pl-2"><code class="code">{"{bot?}"}</code>: whether the user is a bot</li>
        <li class="pl-2"><code class="code">{"{user-avatar}"}</code>: the user's global avatar (ignores their server profile)</li>
    </ul>
    <h2 class="h2">Roles</h2>
    <P>If the context targets a role (e.g. supporter announcements), the following are available:</P>
    <ul class="list-disc pl-4">
        <li class="pl-2"><code class="code">{"{role-icon}"}</code>: the role's icon URL</li>
        <li class="pl-2"><code class="code">{"{role-members}"}</code>: the number of members with the role</li>
        <li class="pl-2"><code class="code">{"{role-name}"}</code>: the role's name</li>
        <li class="pl-2">
            <code class="code">{"{hoist?}"}</code>: whether or not the role is hoisted (displays members with the role separately on the member list)
        </li>
    </ul>
    <h2 class="h2">Guilds</h2>
    <P>If the context targets a server (always), the following are available:</P>
    <ul class="list-disc pl-4">
        <li class="pl-2"><code class="code">{"{server}"}</code>: the server's name</li>
        <li class="pl-2"><code class="code">{"{members}"}</code>: the number of members in the server</li>
        <li class="pl-2"><code class="code">{"{boosts}"}</code>: the number of boosts (not the number of boosting members)</li>
        <li class="pl-2">
            <code class="code">{"{tier}"}</code>: the server's boost tier (<code class="code">0</code>, <code class="code">1</code>,
            <code class="code">2</code>, or <code class="code">3</code>)
        </li>
        <li class="pl-2"><code class="code">{"{server-icon}"}</code>: the server's icon URL</li>
        <li class="pl-2"><code class="code">{"{server-banner}"}</code>: the server's banner URL</li>
        <li class="pl-2"><code class="code">{"{server-splash}"}</code>: the server's discovery splash image URL</li>
        <li class="pl-2"><code class="code">{"{bots}"}</code>: the number of bots in the server</li>
        <li class="pl-2"><code class="code">{"{humans}"}</code>: the number of non-bot members in the server</li>
        <li class="pl-2"><code class="code">{"{boosters}"}</code>: the number of boosting members (not the number of boosts)</li>
    </ul>
    <h2 class="h2">Functions</h2>
    <P>
        The following functions are globally available to manipulate the values. Most values are strings (text), but some are numbers and yes/no values are
        represented as <code class="code">0</code> for false and <code class="code">1</code> for true.
    </P>
    <P>
        Note that these may be confusing to people who have no experience with programming. For the most part, you do not need to use these. The most important
        ones are <code class="code">?</code> (as it allows you to switch between different messages for different occasions), <code class="code">random</code>,
        and <code class="code">ordinal</code>.
    </P>
    <P>
        Arguments surrounded by <code class="code">[]</code> are optional. <code class="code">...</code> indicates that an arbitrary number of arguments are allowed.
    </P>
    <ul class="list-disc pl-4">
        <li class="pl-2">
            <code class="code">{"{? a b [c]}"}</code>: if <code class="code">a</code> is true-like (non-empty string or non-zero number), returns
            <code class="code">b</code>, and otherwise returns <code class="code">c</code> (or <code class="code">""</code> if <code class="code">c</code> is missing)
        </li>
        <li class="pl-2">
            <code class="code">{"{!= ...}"}</code>: returns <code class="code">1</code> if all provided values are unique and <code class="code">0</code> otherwise
            (at least 2 values)
        </li>
        <li class="pl-2"><code class="code">{"{random ...}"}</code>: randomly choose one of the given values (least 1 value)</li>
        <li class="pl-2"><code class="code">{"{list ...}"}</code>: create a list from the provided values</li>
        <li class="pl-2">
            <code class="code">{"{! x}"}</code>: returns <code class="code">1</code> if <code class="code">x</code> is false-like (empty string or
            <code class="code">0</code>) and <code class="code">0</code> otherwise
        </li>
        <li class="pl-2"><code class="code">{"{length x}"}</code>: returns the length of a list</li>
        <li class="pl-2">
            <code class="code">{"{escape x}"}</code>: markdown-escape <code class="code">x</code> so it is displayed as-is in Discord
        </li>
        <li class="pl-2"><code class="code">{"{ordinal #}"}</code>: s the "Nth" form of a number (1st, 2nd, 3rd, etc.) (works for negative numbers)</li>
        <li class="pl-2">
            <code class="code">{"{join x y}"}</code>: returns the values in list <code class="code">x</code> as strings joined on string
            <code class="code">y</code>
        </li>
        <li class="pl-2"><code class="code">{"{+ ...}"}</code>: returns the sum of a list of values, converting into numbers (at least 1 value)</li>
        <li class="pl-2">
            <code class="code">{"{- ...}"}</code>: chain subtraction; <code class="code">{"{- x y z}"}</code> is <code class="code">x - y - z</code>, converting
            into numbers (at least 1 value)
        </li>
        <li class="pl-2"><code class="code">{"{* ...}"}</code>: returns the product of a list of values, converting into numbers (at least 1 value)</li>
        <li class="pl-2">
            <code class="code">{"{/ ...}"}</code>: chain division; <code class="code">{"{/ x y z}"}</code> is <code class="code">x / y / z</code> (at least 1 value)
        </li>
        <li class="pl-2">
            <code class="code">{"{\\ ...}"}</code>: chain floor division; <code class="code">{"{\\ 5 2}"}</code> returns <code class="code">2</code> and not
            <code class="code">2.5</code> (at least 1 value)
        </li>
        <li class="pl-2"><code class="code">{"{# x}"}</code>: returns the length of a list</li>
        <li class="pl-2">
            <code class="code">{"{# ...}"}</code>: index access; <code class="code">{"{# w x y z}"}</code> is equivalent to <code class="code">a[b][c][d]</code>
        </li>
        <li class="pl-2">
            <code class="code">{"{% ...}"}</code>: chain modulo (remainder after division); e.g. <code class="code">{"{% 7 3}"}</code> is
            <code class="code">1</code> (at least 1 value)
        </li>
        <li class="pl-2">
            <code class="code">{"{^ ...}"}</code>: chain exponentiation; e.g. <code class="code">{"{^ x y z}"}</code> is <code class="code">(x ^ y) ^ z</code> (at
            least 1 value)
        </li>
        <li class="pl-2">
            <code class="code">{"{&& ...}"}</code>: logical AND (return the first false-like value or the last value if all are true-like) (at least 1 value)
        </li>
        <li class="pl-2">
            <code class="code">{"{|| ...}"}</code>: logical OR (return the first true-like value or the last value if all are false-like) (at least 1 value)
        </li>
        <li class="pl-2"><code class="code">{"{++ ...}"}</code>: concatenate lists together (at least 1 value)</li>
        <li class="pl-2"><code class="code">{"{= ...}"}</code>: returns <code class="code">1</code> if all provided values are equal</li>
        and<code class="code">0</code> otherwise
        <li class="pl-2">
            <code class="code">{"{> ...}"}</code>: returns <code class="code">1</code> if all provided values are in strictly descending order and
            <code class="code">0</code> otherwise
        </li>
        <li class="pl-2">
            <code class="code">{"{>= ...}"}</code>: returns <code class="code">1</code> if all provided values are in non-increasing order and
            <code class="code">0</code> otherwise
        </li>
        <li class="pl-2">
            <code class="code">{"{< ...}"}</code>: returns <code class="code">1</code> if all provided values are in strictly increasing order and
            <code class="cod">0</code> otherwise
        </li>
        <li class="pl-2">
            <code class="code">{"{<= ...}"}</code>: returns <code class="code">1</code> if all provided values are non-decreasing order and
            <code class="code">0</code> otherwise
        </li>
        <li class="pl-2">
            <code class="code">{"{... fn values}"}</code>: call a function with the provided list as arguments; e.g.
            <code class="code">{"{... fn {list 1 2 3}}"}</code>
            is equivalent to <code class="code">{"{fn 1 2 3}"}</code>
        </li>
        <li class="pl-2">
            <code class="code">{"{map fn values}"}</code>: call a function over each element of a list; e.g. <code class="code">{"{map fn {list 1 2 3}}"}</code>
            is equivalent to <code class="code">{"{list {fn 1} {fn 2} {fn 3}}"}</code>
        </li>
    </ul>
    <h2 class="h2">Values</h2>
    <P>
        You can also insert values into functions. To include a number, just enter the number. To include a string, surround it with quotes. Both
        <code class="code">"..."</code> and <code class="code">'...'</code> work the same way. If you wish to include the same type of quotes within the string,
        escale them like so: <code class="code">"hello \" world"</code>.
    </P>
</Container>
