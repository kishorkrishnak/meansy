const word = document.querySelector(".word");
const phonetic = document.querySelector(".phonetic");
const message = document.querySelector(".message");

const meanings = document.querySelector(".meanings");
const wikiTitle = document.querySelector(".wiki-title");
const wikiContent = document.querySelector(".wiki-content");
const synonymsAntonyms = document.querySelector(".synonyms-antonyms");

const pronunciationBtn = document.querySelector(".play-audio");
const loadingAnimation = document.querySelector(".container");

const audio = new Audio();

pronunciationBtn.addEventListener("click", () => {
  audio.play();
});

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let result;
  try {
    [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => getSelection().toString().split(" ")[0],
    });
  } catch (e) {
    return;
  }
  if (result) {
    showLoadingAnimation();
    const selectedWordData = await fetchWordMeaning(result);
    const wikipediaData = await fetchWordWikipedia(result);
    hideLoadingAnimation();

    if (selectedWordData && selectedWordData.length > 0 && selectedWordData?.[0].meanings && selectedWordData?.[0].meanings.length > 0) {
      word.textContent = result;
      console.log(selectedWordData)

      if (selectedWordData[0]?.phonetic)
        phonetic.textContent = selectedWordData[0].phonetic;
      selectedWordData[0].meanings.forEach((meaning) => {
        const title = document.createElement("dt");
        title.classList.add("meaning-title");
        title.textContent = meaning.partOfSpeech;
        const data = document.createElement("dd");
        data.classList.add("meaning-data");
        const definition = document.createElement("p");
        const example = document.createElement("p");
        example.classList.add("meaning-example");
        definition.textContent = meaning.definitions[0].definition;
        if (meaning.definitions[0].example) {
          example.textContent = `"${meaning.definitions[0].example}"`;
        }
        const wrapper = document.createElement("div");
        wrapper.append(definition);
        if (example.textContent) wrapper.append(example);
        meanings.appendChild(title);
        meanings.appendChild(wrapper);


        synonymsAntonyms.innerHTML = '';

        const synonymsTitle = document.createElement("dt");
        synonymsTitle.classList.add("synonyms-title");
        synonymsTitle.textContent = "Synonyms";
        const synonymsData = document.createElement("dd");
        synonymsData.classList.add("synonyms-data");
        const synonymsList = document.createElement("p");
        let synonyms = []
        selectedWordData[0].meanings.forEach((item) => {
          synonyms = [...synonyms, ...item.synonyms];
        })
        if (synonyms.length > 0) {
          synonymsList.textContent = synonyms.join(", ");

        } else {
          synonymsList.textContent = "No synonyms found"

        }
        synonymsData.appendChild(synonymsList);
        synonymsAntonyms.appendChild(synonymsTitle);
        synonymsAntonyms.appendChild(synonymsData);

        const antonymsTitle = document.createElement("dt");
        antonymsTitle.classList.add("antonyms-title");
        antonymsTitle.textContent = "Antonyms";
        const antonymsData = document.createElement("dd");
        antonymsData.classList.add("antonyms-data");
        const antonymsList = document.createElement("p");

        let antonyms = []
        selectedWordData[0].meanings.forEach((item) => {
          antonyms = [...antonyms, ...item.antonyms];
        })

        if (antonyms.length > 0) {
          antonymsList.textContent = antonyms.join(", ");

        } else {
          antonymsList.textContent = "No antonyms found"

        }
        antonymsData.appendChild(antonymsList);
        synonymsAntonyms.appendChild(antonymsTitle);
        synonymsAntonyms.appendChild(antonymsData);
      });
    } else {
      message.textContent = "Could not find meaning for this word 😓";
    }

    let selectedWordAudio = ""
    selectedWordData[0]?.phonetics.forEach((item) => {
      if (item?.audio) return selectedWordAudio = item.audio
    })
    if (selectedWordAudio) {
      audio.src = selectedWordAudio
      pronunciationBtn.style.display = "block";
    } else {
      pronunciationBtn.style.display = "none";
    }


    if (wikipediaData && wikipediaData.query.pages) {
      const pageId = Object.keys(wikipediaData.query.pages)[0];
      const page = wikipediaData.query.pages[pageId];
      wikiTitle.textContent = page.title;
      wikiContent.innerHTML = page.extract;

      const readMoreBtn = document.createElement("div");
      readMoreBtn.classList.add("read-more-btn");
      readMoreBtn.innerHTML = `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}" target="_blank">Read more</a>`;
      wikiContent.appendChild(readMoreBtn);
    } else {
      wikiContent.textContent = "No Wikipedia article found for this word";
    }
  } else {
    message.textContent = "Select a word to display its meaning... 😊";
  }
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");
      openTab(item.getAttribute("data-tab"));
    });
  });
  openTab("meaning");
});

const fetchWordMeaning = async (result) => {
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${result}`);
  const data = await response.json();
  return data;
};

const fetchWordWikipedia = async (result) => {
  const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${result}&format=json&origin=*`);
  const searchData = await searchResponse.json();
  if (searchData.query.search.length === 0) {
    return null;
  }
  const titles = searchData.query.search.slice(0, 2).map(item => item.title);
  for (const title of titles) {
    const contentResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${title}&format=json&origin=*`);
    const contentData = await contentResponse.json();
    const pages = contentData.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    if (page && page.extract && page.extract.length > 100) {
      return contentData;
    }
  }
  return null;
};

const openTab = (tabName) => {
  const tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].style.display = "none";
  }
  document.getElementById(tabName).style.display = "block";
};

const showLoadingAnimation = () => {
  loadingAnimation.style.display = "flex";
};

const hideLoadingAnimation = () => {
  loadingAnimation.style.display = "none";
};
