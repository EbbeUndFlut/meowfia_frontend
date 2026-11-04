const API_URL = 'http://127.0.0.1:6767/api/v1/clan/new'

const form = document.querySelector('.clanform')
const errorBox = document.querySelector('.clanpage .error')
const successBox = document.querySelector('.clanpage .success')
const submitButton = form.querySelector('button[type="submit"]')

form.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideMessages()

    const donName = form.elements.donName.value.trim()
    const clanName = form.elements.clanName.value.trim()

    const skills = form.elements.donSkills.value
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)

    if (!donName || !clanName) {
        showError('Bitte gib sowohl dem Don als auch dem Clan einen Namen.')
        return
    }

    const payload = [
        {
            name: donName,

        },
        {
            name: clanName
        }
    ]

    submitButton.disabled = true
    submitButton.textContent = 'Wird erstellt …'

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const details = await response.text()
            throw new Error(details || `Serverfehler (${response.status})`)
        }

        showSuccess(
            `Der Clan „${clanName}“ und Don „${donName}“ wurden angelegt.`
        )

        form.reset()

    } catch (error) {
        console.error('Clan konnte nicht erstellt werden:', error)

        showError(
            `Clan konnte nicht erstellt werden. ${error.message}`
        )

    } finally {
        submitButton.disabled = false
        submitButton.innerHTML = 'Clan gründen <span aria-hidden="true">→</span>'
    }
})


function hideMessages() {
    errorBox.classList.remove('show')
    successBox.classList.remove('show')

    errorBox.textContent = ''
    successBox.textContent = ''
}


function showError(message) {
    errorBox.textContent = message
    errorBox.classList.add('show')
}


function showSuccess(message) {
    successBox.textContent = message
    successBox.classList.add('show')
}