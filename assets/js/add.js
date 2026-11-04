const addForm = document.querySelector('form')
const errorElement = document.querySelector('.error')
const previewImg = document.querySelector('img')

addForm.catname.addEventListener('input', (event) => {
    previewImg.src = `https://robohash.org/${event.target.value}.png?set=set4`
})

addForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.target
    const newCat = {
        name: form.catname.value,
        rank: form.catrank.value,
        speciality: form.catspecialty.value
    }
    try {
        await newMember(newCat)
        errorElement.classList.remove('show')
        form.reset()
    } catch (error) {
        errorElement.classList.add('show')

    }

})

async function newMember(cat) {
    const resp = await fetch('http://127.0.0.1:8989/api/v1/members', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(cat)
    })
    if (!resp.ok)
        throw new Error('Katze konnte nicht angelegt werden')
}