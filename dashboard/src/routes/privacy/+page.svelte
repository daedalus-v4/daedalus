<script>
    import A from "$lib/components/A.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import P from "$lib/components/P.svelte";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Privacy Policy</p>
</Header>

<Container main>
    <P>Effective as of November 29th, 2023</P>
    <h2 class="h2">Privacy Policy</h2>
    <P>Daedalus stores message content for the purposes of providing logs for modmail and tickets. Other messages are not stored.</P>
    <P>
        <ul class="list-disc pl-4">
            <li class="pl-2">
                If you DM the bot and confirm sending the message through modmail to a server, it will be logged and that server's staff team will be able to
                view the contents of the thread afterwards.
            </li>
            <li class="pl-2">
                If you type messages into a modmail thread from the server side, they will be stored as internal messages even if you do not send them as a
                reply, and other staff will be able to view those messages afterwards.
            </li>
            <li class="pl-2">All messages within ticket channels will be stored and staff will be able to view them afterwards.</li>
        </ul>
    </P>
    <P>
        You may request redaction of specific messages or full redaction of all of your stored message content data through the
        <A to="https://discord.gg/7TRKfSK7EU" external>support server</A>, e-mailing <A>hyperneutrino15@gmail.com</A>, or direct messaging <b>@hyperneutrino</b>
        on Discord (you should join the support server to use it as a mutual server).
    </P>
    <P>
        Otherwise, Daedalus does not store any data except what you explicitly enter into the dashboard or the bot through commands such as logging user
        history. You may contact us through the contact methods specified in the <A to="/terms" external>Terms of Service</A> to request that your data is expunged
        as applicable.
    </P>
    <P>
        The server owner may request their server's data to be fully deleted and a user may request data that is applicable only to their own usage to be
        removed, e.g. reminders and highlights. However, users may not request data not entered by themselves or Daedalus to be removed (e.g. user history
        logged by servers' staff members).
    </P>
</Container>
