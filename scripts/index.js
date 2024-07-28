const word = document.querySelector(".word")
const message = document.querySelector(".message")
const meanings = document.querySelector(".meanings")

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let result;
  try {
    [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => getSelection().toString(),
    });
  } catch (e) {
    return;
  }
  if (result) {
    word.textContent = result
    const selectedWordData = await fetchWordMeaning(result)
    if (selectedWordData && selectedWordData.length > 0 && selectedWordData?.[0].meanings && selectedWordData?.[0].meanings.length > 0) {
      console.log(selectedWordData[0])
      selectedWordData[0].meanings.forEach((meaning) => {
        const title = document.createElement("dt")
        title.classList.add("meaning-title")
        title.textContent = meaning.partOfSpeech
        const data = document.createElement("dd")
      data.classList.add("meaning-data")

        data.textContent = meaning.definitions[0].definition

        meanings.appendChild(title)
        meanings.appendChild(data)
      })

    }
    else
      message.textContent = "Could not find meaning for this word"
  } else {
    message.textContent = "Select a word to display its meaning... 😊"

  }
})

const fetchWordMeaning = async (result) => {
  message.textContent = "Loading..."
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${result}`)
  const data = await response.json()
  message.textContent = ""

  return data

}