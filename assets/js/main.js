const API_URL = 'http://127.0.0.1:6767/api/v1/clan';

const clanSection = document.querySelector('.clans');
const errorBox = document.querySelector('.clanerror');
const numberFormat = new Intl.NumberFormat('de-DE');

function element(tag, className, text) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined && text !== null) {
        node.textContent = text;
    }

    return node;
}

function createClanCard(clan) {
    const card = element('article', 'clancard');

    const top = element('div', 'clantop');
    top.append(
        element('span', 'clanid', `FAMILIE #${String(clan.id).padStart(2, '0')}`),
        element('span', 'clanbadge', 'Aktiver Clan')
    );

    const name = element(
        'h2',
        'clanname',
        clan.clan_name || 'Unbenannter Clan'
    );

    // Don mit Avatar und Namen
    const don = element('div', 'clandon');

    const avatar = element('img', 'clanavatar');
    avatar.src = clan.donAvatar || '';
    avatar.alt = `Avatar von ${clan.donName || 'unbekannt'}`;
    avatar.loading = 'lazy';
    avatar.referrerPolicy = 'no-referrer';

    avatar.addEventListener('error', () => {
        avatar.classList.add('avatarfallback');
        avatar.removeAttribute('src');
        avatar.alt = 'Kein Don-Bild verfügbar';
    }, { once: true });

    const donInfo = element('div', 'clandoninfo');
    donInfo.append(
        element('small', '', 'DON DER FAMILIE'),
        element('strong', 'donname', clan.donName || 'Unbekannt')
    );

    don.append(avatar, donInfo);

    // Clan-Statistiken
    const stats = element('div', 'clanstats');

    stats.append(
        createStat('Mitglieder', clan.mitglieder, '♟'),
        createStat('Regionen', clan.regionen, '⌖'),
        createStat(
            'Fische',
            numberFormat.format(Number(clan.fische) || 0),
            '🐟',
            true
        )
    );

    // Wählen-Button (aktuell ohne Funktion)
    const selectButton = element('button', 'clanselect', 'Wählen');
    selectButton.type = 'button';
    selectButton.addEventListener('click', async (event) => {
        const resp = await fetch(API_URL + `/set/${clan.id}`, {
            credentials: "include"
        })

        const cookie = await cookieStore.get("clan")
        console.log(JSON.parse(decodeURIComponent(cookie.value)))
    })

    card.append(top, name, don, stats, selectButton);

    return card;
}

function createStat(label, value, icon, highlight = false) {
    const stat = element(
        'div',
        `clanstat${highlight ? ' fishstat' : ''}`
    );

    const text = element('div', 'clanstattext');

    stat.append(
        element('span', 'clanstaticon', icon),
        text
    );

    text.append(
        element('strong', '', value ?? 0),
        element('small', '', label)
    );

    return stat;
}

async function loadClans() {
    clanSection.replaceChildren(
        element('p', 'clanstatus', 'Lade Clans …')
    );

    errorBox.classList.remove('show');

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                `Server antwortet mit Status ${response.status}`
            );
        }

        const clans = await response.json();

        if (!Array.isArray(clans)) {
            throw new Error(
                'Die API hat keine gültige Clan-Liste zurückgegeben.'
            );
        }

        if (clans.length === 0) {
            clanSection.replaceChildren(
                element(
                    'p',
                    'clanstatus',
                    'Noch keine Clans vorhanden. Gründe den ersten Clan!'
                )
            );
            return;
        }

        clanSection.replaceChildren(...clans.map(createClanCard));

    } catch (error) {
        console.error('Clans konnten nicht geladen werden:', error);

        clanSection.replaceChildren();

        errorBox.textContent =
            `Clans konnten nicht geladen werden. ${error.message}`;

        errorBox.classList.add('show');
    }
}

loadClans();