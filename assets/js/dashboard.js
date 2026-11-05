// Das Dashboard gehört zu dem Clan, den der "Wählen"-Button auf der Clan-Seite
// serverseitig (Cookie) gesetzt hat. Deshalb braucht der Endpunkt keine ID.
const API_URL = 'http://127.0.0.1:6767/api/v1/clan/dashboard';
const CLANS_URL = '../../index.html';

const root = document.querySelector('.dashboard');
const errorBox = document.querySelector('.dasherror');
const numberFormat = new Intl.NumberFormat('de-DE');

// Text wird immer per textContent gesetzt, API-Daten können so kein HTML einschleusen
function element(tag, className, text) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined && text !== null) {
        node.textContent = text;
    }

    return node;
}

// "Golden Pawwwss" -> "GP", "Milo" -> "MI"
function initials(name) {
    const capitals = name.match(/[A-ZÄÖÜ]/g);
    if (capitals && capitals.length >= 2) return capitals.slice(0, 2).join('');
    return name.slice(0, 2).toUpperCase();
}

// Bild mit Platzhalter (Initialen), falls es fehlt oder nicht lädt
function createAvatar(src, name, className) {
    const fallback = () => element('div', `${className} fallback`, initials(name));

    if (!src) return fallback();

    const img = element('img', className);
    img.src = src;
    img.alt = `Avatar von ${name}`;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => img.replaceWith(fallback()), { once: true });

    return img;
}

/*
 * Antwort von /api/v1/clan/dashboard (so liefert sie das Backend):
 *
 * {
 *   clan:       { id, clan_name, fische, don_id },
 *   don:        { id, cat_name, skill, avatar_url, salary, ... },
 *   regions:    [ { id, region_name, fish_rate, clan_id } ],
 *   mitglieder: [ { id, cat_name, skill, avatar_url, salary, ... } ]   // enthält auch den Don
 * }
 *
 * Weicht die Antwort einmal ab, muss nur diese Funktion angepasst werden.
 */
function normalize(raw) {
    const clan = raw.clan ?? {};
    const don = raw.don ?? {};

    const members = Array.isArray(raw.mitglieder)
        ? raw.mitglieder.map((cat) => ({
            id: cat.id,
            name: cat.cat_name || 'Unbekannt',
            skill: cat.skill || '',
            avatar: cat.avatar_url || '',
            salary: typeof cat.salary === 'number' ? cat.salary : null,
        }))
        : null;

    const regions = Array.isArray(raw.regions)
        ? raw.regions.map((region) => ({
            id: region.id,
            name: region.region_name || 'Unbenanntes Gebiet',
            rate: Number(region.fish_rate) || 0,
        }))
        : null;

    return {
        id: clan.id,
        name: clan.clan_name || 'Unbenannter Clan',
        fish: Number(clan.fische) || 0,
        donId: clan.don_id ?? don.id,
        donName: don.cat_name || 'Unbekannt',
        donAvatar: don.avatar_url || '',
        memberCount: members ? members.length : 0,
        regionCount: regions ? regions.length : 0,
        members,
        regions,
    };
}

function isDon(data, cat) {
    return data.donId !== undefined && data.donId !== null
        ? cat.id === data.donId
        : cat.name === data.donName;
}

function createHero(data) {
    const hero = element('section', 'dashhero');

    const pic = element('div', 'dashdonpic');
    pic.append(createAvatar(data.donAvatar, data.donName, 'dashavatar'));

    const tags = element('div', 'dashtags');
    tags.append(
        element('span', 'dashlabel', 'DON DER FAMILIE'),
        element('span', 'dashid', `FAMILIE #${String(data.id ?? 0).padStart(2, '0')}`)
    );

    const don = element('p', 'dashdon');
    don.append('Angeführt von ', element('strong', '', data.donName));

    const info = element('div', 'dashheroinfo');
    info.append(tags, element('h1', 'dashtitle', data.name), don);

    const switchLink = element('a', 'dashswitch', 'Clan wechseln');
    switchLink.href = CLANS_URL;

    hero.append(pic, info, switchLink);
    return hero;
}

function createStat(label, value, hint, tone) {
    const stat = element('div', tone ? `dashstat ${tone}` : 'dashstat');
    stat.append(element('small', '', label), element('strong', '', value));
    if (hint) stat.append(element('span', 'dashhint', hint));
    return stat;
}

function createStats(data) {
    // Fische pro Tick = Summe der Fischraten aller Regionen des Clans
    const perTick = data.regions
        ? data.regions.reduce((sum, region) => sum + region.rate, 0)
        : null;

    const stats = element('section', 'dashstats');
    stats.append(
        createStat('Fische', numberFormat.format(data.fish), 'im Clan-Lager', 'gold'),
        createStat('Mitglieder', numberFormat.format(data.memberCount)),
        createStat('Regionen', numberFormat.format(data.regionCount)),
        createStat(
            'Fische pro Tick',
            perTick === null ? '–' : `+${numberFormat.format(perTick)}`,
            'Summe aller Regionen',
            'gold'
        )
    );

    return stats;
}

function createPanel(title, count, content) {
    const panel = element('section', 'dashpanel');

    const head = element('div', 'dashpanelhead');
    head.append(element('h2', '', title), element('span', 'dashcount', numberFormat.format(count)));

    const list = element('div', 'dashlist');
    list.append(content);

    panel.append(head, list);
    return panel;
}

function createMember(data, cat) {
    const don = isDon(data, cat);
    const card = element('article', don ? 'dashmember don' : 'dashmember');

    const nameRow = element('div', 'dashmembername');
    nameRow.append(element('strong', '', cat.name));
    if (don) nameRow.append(element('span', 'dashdonbadge', 'DON'));

    const info = element('div', 'dashmemberinfo');
    info.append(nameRow);
    if (cat.skill) info.append(element('small', 'dashskill', cat.skill));
    if (cat.salary !== null) {
        info.append(element('small', 'dashsalary', `Gehalt ${numberFormat.format(cat.salary)}`));
    }

    card.append(createAvatar(cat.avatar, cat.name, 'dashavatar'), info);
    return card;
}

function createMembersPanel(data) {
    if (!data.members) return null;

    if (data.members.length === 0) {
        return createPanel('Mitglieder', 0, element('p', 'dashempty', 'Noch keine Mitglieder.'));
    }

    // der Don steht ganz oben, sonst bleibt die Reihenfolge der API
    const sorted = [...data.members].sort((a, b) => Number(isDon(data, b)) - Number(isDon(data, a)));

    const grid = element('div', 'dashmembers');
    grid.append(...sorted.map((cat) => createMember(data, cat)));

    return createPanel('Mitglieder', data.members.length, grid);
}

function createRegion(region, maxRate) {
    const row = element('article', 'dashregion');

    const name = element('div', 'dashregionname');
    name.append(element('strong', '', region.name), element('small', 'dashregionid', `#${String(region.id ?? 0).padStart(2, '0')}`));

    const top = element('div', 'dashregiontop');
    top.append(name, element('span', 'dashregionrate', `+${numberFormat.format(region.rate)} / Tick`));

    const bar = element('div', 'dashbar');
    const fill = element('span');
    fill.style.width = `${(region.rate / maxRate) * 100}%`;
    bar.append(fill);

    row.append(top, bar);
    return row;
}

function createRegionsPanel(data) {
    if (!data.regions) return null;

    if (data.regions.length === 0) {
        return createPanel('Regionen', 0, element('p', 'dashempty', 'Noch keine Regionen.'));
    }

    // einträglichste Region zuerst, der Balken zeigt die Rate im Verhältnis zur besten
    const sorted = [...data.regions].sort((a, b) => b.rate - a.rate);
    const maxRate = Math.max(sorted[0].rate, 1);

    const list = element('div', 'dashregions');
    list.append(...sorted.map((region) => createRegion(region, maxRate)));

    return createPanel('Regionen', data.regions.length, list);
}

function render(data) {
    document.title = `Meowfia - ${data.name}`;

    const panels = [createMembersPanel(data), createRegionsPanel(data)].filter(Boolean);

    root.replaceChildren(createHero(data), createStats(data));

    if (panels.length > 0) {
        const grid = element('div', panels.length === 1 ? 'dashgrid single' : 'dashgrid');
        grid.append(...panels);
        root.append(grid);
    }
}

function showMessage(title, text) {
    const box = element('div', 'dashstatus');
    box.append(element('strong', '', title));
    if (text) box.append(element('p', '', text));

    const link = element('a', 'dashswitch', 'Zu den Clans');
    link.href = CLANS_URL;
    box.append(link);

    root.replaceChildren(box);
}

async function loadDashboard() {
    errorBox.classList.remove('show');

    try {
        const response = await fetch(API_URL, { credentials: 'include' });

        // kein Clan gewählt (kein Cookie) bzw. Clan nicht gefunden
        if ([401, 403, 404].includes(response.status)) {
            showMessage('Noch kein Clan ausgewählt', 'Wähle zuerst einen Clan, dann erscheint hier sein Dashboard.');
            return;
        }

        if (!response.ok) {
            throw new Error(`Server antwortet mit Status ${response.status}`);
        }

        const raw = await response.json();

        if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new Error('Die API hat keine gültigen Dashboard-Daten zurückgegeben.');
        }

        render(normalize(raw));
    } catch (error) {
        console.error('Dashboard konnte nicht geladen werden:', error);

        errorBox.textContent = `Dashboard konnte nicht geladen werden. ${error.message}`;
        errorBox.classList.add('show');

        const link = element('a', 'dashswitch', 'Zu den Clans');
        link.href = CLANS_URL;
        root.replaceChildren(link);
    }
}

loadDashboard();
