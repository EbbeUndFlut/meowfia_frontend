const memberSection = document.querySelector('.members')

const resp = await fetch('http://localhost:6767/api/v1/cat')
const data = await resp.json()

for (const member of data) {
    memberSection.append(createMemberCard(member))
}


function createMemberCard(member) {
    const cardContainer = document.createElement('div')
    cardContainer.classList.add('cardcontainer')
    const cardImage = document.createElement('img')
    cardImage.classList.add('cardimage')
    cardImage.src = member.avatar_url
    const cardInfo = document.createElement('div')
    cardInfo.classList.add('classinfo')
    const memberName = document.createElement('p')
    memberName.textContent = member.cat_name
    const memberRank = document.createElement('div')
    memberRank.classList.add('memberrank')
    memberRank.textContent = member.cat_rank
    const speciality = document.createElement('div')
    speciality.classList.add('speciality')
    speciality.textContent = member.speciality
    cardInfo.append(memberName, memberRank, speciality)
    cardContainer.append(cardImage, cardInfo)
    return cardContainer
}