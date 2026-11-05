const API_URL = 'http://127.0.0.1:6767/api/v1/cat/free'

const catContainer = document.querySelector('.members')
const subtitle = document.querySelector('.pagehead p')
const errorBox = document.querySelector('.error')

const numberFormat = new Intl.NumberFormat('de-DE')

// creates an element; text is set via textContent so API data can never inject HTML
function el(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text !== undefined) node.textContent = text
    return node
}

// "Don Whiskers" -> "DW", "Milo" -> "MI"
function initials(name) {
    const capitals = name.match(/[A-ZÄÖÜ]/g)
    if (capitals && capitals.length >= 2) return capitals.slice(0, 2).join('')
    return name.slice(0, 2).toUpperCase()
}

// placeholder with the cat's initials, used when there is no picture or it fails to load
function createFallback(name) {
    return el('div', 'cardimage fallback', initials(name))
}

function createAvatar(cat) {
    if (!cat.avatarUrl) return createFallback(cat.catName)

    const img = el('img', 'cardimage')
    img.src = cat.avatarUrl
    img.alt = cat.catName
    img.loading = 'lazy'
    img.addEventListener('error', () => img.replaceWith(createFallback(cat.catName)), { once: true })
    return img
}

function createCatCard(cat) {
    const card = el('div', 'cardcontainer')

    const info = el('div', 'classinfo')
    info.append(el('p', '', cat.catName))

    if (typeof cat.salary === 'number') {
        info.append(el('div', 'memberrank', `Salary ${numberFormat.format(cat.salary)}`))
    }

    // skill can be null; an empty .speciality is hidden by the stylesheet
    info.append(el('div', 'speciality', cat.skill ?? ''))

    // no function yet
    const settings = el('button', 'cardbutton', 'Anheuern')
    settings.type = 'button'
    settings.setAttribute('aria-label', `Settings for ${cat.catName}`)

    settings.addEventListener('click', async (event) => {
        await fetch(`http://127.0.0.1:6767/api/v1/cat/hire/${cat.id}`, {
            method: 'PUT',
            credentials: "include"
        })
    })
    info.append(settings)

    card.append(createAvatar(cat), info)
    return card
}

try {
    catContainer.replaceChildren(el('p', 'memberstatus', 'Loading cats …'))

    const resp = await fetch(API_URL)
    if (!resp.ok) throw new Error(`Server answered with status ${resp.status}`)
    const cats = await resp.json()

    if (cats.length === 0) {
        subtitle.textContent = 'streunende Katzen.'
        catContainer.replaceChildren(el('p', 'memberstatus', 'No cats without a clan right now.'))
    } else {
        subtitle.textContent = `${cats.length}  streunende ${cats.length === 1 ? 'Katze' : 'Katzen'}.`
        catContainer.replaceChildren(...cats.map(createCatCard))
    }
} catch (error) {
    console.log(error)
    catContainer.replaceChildren()
    errorBox.textContent = 'Could not load cats. Is the server running?'
    errorBox.classList.add('show')
}
