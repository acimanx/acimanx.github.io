////////////////////////////////////////////////////////////////////////
const hashString = s =>
  s.split("").reduce((a, b) => {
    let start = a
    start = (start << 5) - start + b.charCodeAt(0)
    return start & start
  }, 0)

const cachedFetch = (url, options) => {
  let expiry = 5 * 60
  if (typeof options === "number") {
    expiry = options
    options = undefined
  } else if (typeof options === "object") {
    expiry = options.seconds || expiry
  }
  let cacheKey = hashString(url)
  let cached = localStorage.getItem(cacheKey)
  let whenCached = localStorage.getItem(`${cacheKey}:ts`)
  if (cached !== null && whenCached !== null) {
    let age = (Date.now() - whenCached) / 1000
    if (age < expiry) {
      let response = new Response(new Blob([cached]))
      return Promise.resolve(response)
    } else {
      localStorage.removeItem(cacheKey)
      localStorage.removeItem(`${cacheKey}:ts`)
    }
  }
  return fetch(url, options).then(response => {
    if (response.status === 200) {
      const ct = response.headers.get("Content-Type")
      if (ct && ct.includes("application/json")) {
        response
          .clone()
          .text()
          .then(content => {
            localStorage.setItem(cacheKey, content)
            localStorage.setItem(`${cacheKey}:ts`, Date.now())
          })
      }
    }
    return response
  })
}


///////////////////////////////////////////////////////////////////16:30
const user = ""
const token = ""
const creds = `${user}:${token}`
const auth = btoa(creds)
////////////////////////////////////////////////////////////////////////
const options = {
  headers: {
    Accept: "application/json",
    //Authorization: "Basic " + auth
  }
}
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

const fetchData = async () => {
  const endpoint = "https://api.github.com/orgs/HackYourFuture"
  const urls = [
    `${endpoint}`,
    `${endpoint}/repos?per_page=100`,
    `${endpoint}/events`
  ]
  const data = await Promise.all(
    urls.map(url => cachedFetch(url, options).then(r => r.json()))
  )
  const contrsUrls = await Promise.all(
    data[1].map(item => item.contributors_url)
  )
  const contrs = await Promise.all(
    contrsUrls.map(url =>
      cachedFetch(url, options).then(r => (r.status === 204 ? [] : r.json()))
    )
  )
  const contrsFlat = contrs.flat()
  var contrsUniq = [];
  contrsFlat.forEach(function (a) {
    if (!this[a.login]) {
      this[a.login] = { avatar_url: a.avatar_url, login: a.login, url: a.url, html_url: a.html_url, contributions: 0 };
      contrsUniq.push(this[a.login]);
    }
    this[a.login].contributions += a.contributions;
  }, Object.create(null));

  const usersUrls = contrsUniq.map(item => item.url)
  const users = await Promise.all(
    usersUrls.map(url => cachedFetch(url, options).then(r => r.json()))
  )

  const UserContrsData = users.map(x => Object.assign(x, contrsUniq.find(y => y.login == x.login)));

  // contrs.reduce((acc, cur) => {
  //   acc[cur[id]] = cur;
  //   return acc;
  // }, Object.assign({}, []));
  // contrs.reduce((acc, cur) => { acc[cur.login] = cur; Object.assign(acc[cur.login] || {}, cur); return acc }, []);

  return main(data[0], data[1], data[2], UserContrsData), status("I'm ready :)", !1)
}

fetchData().catch(err => console.log(err))

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

const root = document.getElementById("root")
root.innerHTML = `
<div id="status"></div>
<nav>
<div><i></i><span></span><span></span><span></span></div>
<dropdown>
<input id=t-1 type=checkbox>
<input id=t-2 type=checkbox>
<input id=t-3 type=checkbox>
<label for=t-1 id=l-1>Home</label>
<label for=t-2>Repositories<i class=sidebar-badge>000</i></label>
<ul id=m-2>
<li value=0>Blanc
</ul>
<label for=t-3 id=l-3>Contributors</label>
</dropdown>
</nav>
<main>
<section id=home><span id=hi><span>Welcome Back!</span><span>Here's an overview of what's happening with your organization...
</span></span>
<div id=info-t><span>0000</span><span>Total Public Contributions</span><span>All public contributions for HackYourFuture
</span></div>
<div id=info-w><span>00</span><span>Total contributors</span></div>
<span>Details</span><span>Top contributors<a href=#>Check all contributors</a></span>
<div id=details>
<div><span>0000</span>Total Commits</div>
<div><span>0000</span>Total Repositories</div>
<div><span>0000</span>Total Issues</div>
<div><span>0000</span>Total Forks</div>
</div>
<div id=top>
<div>A</div>
<div>B</div>
<div>C</div>
</div>
<span>Latest activity</span>
<div id=activity>
</div>
</section>
</main>`

function status(text, visibility) {
  const elStatus = document.querySelector("#status")
  const body = document.querySelector("body")
  if (visibility === true) {
    ; (elStatus.style.opacity = 1), (elStatus.style.visibility = "visible"), (body.style.overflow = "hidden")
  } else {
    ; (elStatus.style.opacity = 0), (elStatus.style.visibility = "hidden"), (body.style.overflow = "initial")
  }
  elStatus.innerHTML = text
}
status("preparing resources...", true)


function main(org, orgrepos, orgevents, orgusercontrs) {
  let collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
  listItems = orgrepos.sort((a, b) => collator.compare(a.name, b.name)).reduce((result, item, value) => (result += `<li value="${value}">${item.name}</li>`), "")
  resultElement = document.querySelector("#m-2")
  resultElement.innerHTML = listItems
  document.querySelector("dropdown > label:nth-child(5) > i").innerHTML = `${orgrepos.length}`

  document.querySelector("nav > div > span:nth-child(2)").innerHTML = org.login
  document.querySelector("nav > div > span:nth-child(3)").innerHTML = org.description
  document.querySelector("nav > div > span:nth-child(4)").innerHTML = org.email

  resultElement.onclick = function (event) {
    event = event.target.value
    render(orgrepos[event])
  }

  function render(changeEvent) {
    console.log(changeEvent)
    document.querySelector("toolbar").innerHTML = changeEvent.full_name
    document.querySelector("#info").innerHTML = `<span>${changeEvent.description}</span><span>${changeEvent.forks}</span><span>${changeEvent.open_issues}</span><span>${changeEvent.size}</span>`
  }

  // const top = contrsUniq.sort((a, b) => (a.contributions > b.contributions ? -1 : b.contributions > a.contributions ? 1 : 0));


  document.querySelector("#details > div:nth-child(2) > span").innerHTML = orgrepos.length
  document.querySelector("#details > div:nth-child(3) > span").innerHTML = orgrepos.reduce((sum, { open_issues_count }) => sum + open_issues_count, 0)
  document.querySelector("#details > div:nth-child(4) > span").innerHTML = orgrepos.reduce((sum, { forks_count }) => sum + forks_count, 0)
  document.querySelector("#details > div:nth-child(2) > span").innerHTML = orgrepos.length
  document.querySelector("#info-t > span:nth-child(1)").innerHTML = orgusercontrs.map(item => item.contributions).reduce((prev, next) => prev + next)
  document.querySelector("#info-w > span:nth-child(1)").innerHTML = orgusercontrs.length

  // document.querySelector("#top").innerHTML = orgusercontrs.map(x => {
  //   console.log(x)
  //     `<div><i style="background-image:url('${x.avatar_url}')"></i><span>${x.name}</span><span>Contributions:${x.contributions}</span></div>`
  // })
  console.log(orgusercontrs.map(x => {
    var rObj = {};
    rObj[x.contributions] = x.contributions;
    return rObj;

  }))


  document.querySelector("#activity").innerHTML = orgevents
    .map(x => {
      let action = "</span><span></span>"
      let type = x.type

      "PushEvent" == x.type && (action = `Pushed ${x.payload.size} commit to <a href="${x.repo.url}">${x.repo.name}</a></span><span>Message: "${x.payload.commits[0].message}"</span>`)

      "PullRequestEvent" == x.type && (type = `${x.type}-${x.payload.action}`)

      "PullRequestEvent" == x.type &&
        "opened" == x.payload.action &&
        (action = `Opened a pull request <a href="${x.payload.pull_request.html_url}">${x.payload.pull_request.title}</a> in <a href="${x.payload.pull_request.base.repo.html_url}">${
          x.payload.pull_request.base.repo.name
          }</a></span><span></span>`)

      "PullRequestEvent" == x.type &&
        "closed" == x.payload.action &&
        (action = `Closed a pull request <a href="${x.payload.pull_request.html_url}">${x.payload.pull_request.title}</a> in <a href="${x.payload.pull_request.head.repo.html_url}">${
          x.payload.pull_request.head.repo.name
          }</a></span><span></span>`)

      "PullRequestReviewCommentEvent" == x.type &&
        (action = `Wrote a <a href="${x.payload.comment.html_url}">comment</a> in <a href="${x.payload.pull_request.html_url}">${x.payload.pull_request.title}</a></span><span>Message: "${
          x.payload.comment.body
          }"</span>`)

      "ForkEvent" == x.type &&
        (action = `Forked a repo <a href="${x.repo.html_url}">${x.repo.name}</a> to <a href="${x.payload.forkee.html_url}">${x.payload.forkee.name}</a></span><span></span>`)

      "IssueCommentEvent" == x.type &&
        (action = `Wrote a <a href="${x.payload.comment.html_url}">comment</a> in issue <a href="${x.payload.issue.html_url}">${x.payload.issue.title}</a></span><span>Message: "${
          x.payload.comment.body
          }"</span>`)

      "WatchEvent" == x.type && (action = `Starred a repo <a href="https://github.com/${x.repo.name}">${x.repo.name}</a></span><span></span>`)

      const d = new Date(x.created_at)

      return `<div type="${type}" >
      <i></i>
      <span>
      <i style="background-image:url('${x.actor.avatar_url}')"></i>
      <span>${x.actor.login}</span>
      </span>
      <span>${action}<span>${d.getHours()}:${`0${d.getMinutes()}`.substr(-2)}</span></div >`
    })
    .join("")

}
