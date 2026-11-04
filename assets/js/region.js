const API_URL = 'http://127.0.0.1:6767/api/v1/region'

const regionContainer = document.querySelector('.regions')
const statsContainer = document.querySelector('.regionstats')
const filterButtons = document.querySelectorAll('.regionfilter')
const errorBox = document.querySelector('.error')

// one colour per clan, picked by clan id
const CLAN_COLORS = ['#a78bfa', '#f472b6', '#38bdf8', '#fb923c', '#f87171', '#e9b44c']

const FISH_ICON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 12c3-5 9-7 14-3l5-3v12l-5-3c-5 4-11 2-14-3z"/></svg>`

const FILTERS = {
    all: () => true,
    claimed: (region) => region.clan !== null,
    free: (region) => region.clan === null,
}

let regions = []
let activeFilter = 'all'

// creates an element; text is set via textContent so API data can never inject HTML
function el(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text !== undefined) node.textContent = text
    return node
}

function clanColor(clanId) {
    return CLAN_COLORS[(clanId - 1) % CLAN_COLORS.length]
}

// "MoewSuits" -> "MS"
function initials(name) {
    const capitals = name.match(/[A-ZÄÖÜ]/g)
    if (capitals && capitals.length >= 2) return capitals.slice(0, 2).join('')
    return name.slice(0, 2).toUpperCase()
}

// API entry { region: {...}, clan: {...} } -> flat object, clan is null when nobody owns it
function normalize(entry) {
    const clan = entry.clan && entry.clan.id !== null
        ? { id: entry.clan.id, name: entry.clan.name }
        : null
    return {
        id: entry.region.id,
        name: entry.region.name,
        fishRate: entry.region.fish_rate,
        clan,
    }
}

function createRegionCard(region) {
    const claimed = region.clan !== null

    const card = el('article', `regioncard ${claimed ? 'claimed' : 'free'}`)
    if (claimed) card.style.setProperty('--c', clanColor(region.clan.id))

    const top = el('div', 'regiontop')
    top.append(
        el('span', 'regionid', `ID #${String(region.id).padStart(2, '0')}`),
        el('span', 'regionbadge', claimed ? 'Claimed' : 'Free')
    )

    const name = el('h3', 'regionname', region.name)

    const rate = el('div', 'regionrate')
    const rateIcon = el('div', 'regionrateicon')
    rateIcon.insertAdjacentHTML('beforeend', FISH_ICON)
    const rateText = el('div')
    rateText.append(
        el('b', 'regionratevalue', region.fishRate),
        el('small', '', 'fish per tick')
    )
    rate.append(rateIcon, rateText)

    const owner = el('div', 'regionowner')
    const ownerText = el('div')
    ownerText.append(
        el('small', '', 'Owner'),
        el('span', 'regionownername', claimed ? region.clan.name : 'Unclaimed')
    )
    owner.append(
        el('div', 'regionavatar', claimed ? initials(region.clan.name) : '?'),
        ownerText
    )

    card.append(top, name, rate, owner)
    card.addEventListener('click', async (event) => {
        const resp = await fetch(API_URL + `/${region.id}`, {
            method: 'PUT',
            credentials: 'include'
        })
        if (resp.ok)
            location.reload()

    })
    return card
}

function renderStats() {
    const claimed = regions.filter(FILTERS.claimed).length
    const totalRate = regions.reduce((sum, region) => sum + region.fishRate, 0)

    const items = [
        ['Regions', regions.length, ''],
        ['Claimed', claimed, ''],
        ['Free', regions.length - claimed, 'green'],
        ['Total fish / tick', totalRate, 'gold'],
    ]

    statsContainer.replaceChildren(...items.map(([label, value, tone]) => {
        const stat = el('div', `regionstat ${tone}`.trim())
        stat.append(el('small', '', label), el('strong', '', value))
        return stat
    }))
}

function renderFilterCounts() {
    filterButtons.forEach((button) => {
        const count = regions.filter(FILTERS[button.dataset.filter]).length
        button.querySelector('.count').textContent = count
    })
}

function renderRegions() {
    const visible = regions.filter(FILTERS[activeFilter])

    if (visible.length === 0) {
        regionContainer.replaceChildren(el('p', 'regionstatus', 'No regions here.'))
        return
    }
    regionContainer.replaceChildren(...visible.map(createRegionCard))
}

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        activeFilter = button.dataset.filter
        filterButtons.forEach((other) => other.classList.toggle('active', other === button))
        renderRegions()
    })
})

try {
    regionContainer.replaceChildren(el('p', 'regionstatus', 'Loading regions …'))

    const resp = await fetch(API_URL)
    if (!resp.ok) throw new Error(`Server answered with status ${resp.status}`)
    const data = await resp.json()

    // most valuable regions first
    regions = data.map(normalize).sort((a, b) => b.fishRate - a.fishRate)

    renderStats()
    renderFilterCounts()
    renderRegions()
} catch (error) {
    console.log(error)
    regionContainer.replaceChildren()
    errorBox.textContent = 'Could not load regions. Is the server running?'
    errorBox.classList.add('show')
}