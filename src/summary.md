<%= prIdentifier %>

## <%= title %>

<% if (coverageFileFailurePercent) { %>
:white_check_mark: **Passed**
<% } else { %>
:x: **Failed**
<% } %}
Commit: <%= prNumber.substring(0, 7) %>

<% if(customMessage) { %>
<%= customMessage %>
<% } %>

<!-- Totals -->
| Total             | <%= total.percent %>% |
| :---------------- | --------------------: |
<% if (!hasDiffs){ %>| Change from base: |    <%= total.diff %>% |<% } %>
| Total Lines:      |    <%= total.lines %> |

<!-- All files, if diffs aren't present -->
<% if (!hasDiffs && all.length){ %>
<details>
<summary markdown="span">
All files
</summary>

| File | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- |
<% all.forEach((fileSummary) => { %>
<%= renderFileSummary(fileSummary) %>
<% }) %>
</details>
<% } %>


<!-- Changed files -->
<% if (changed.length){ %>
### Changed files

| File | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- |
<% changed.forEach((fileSummary) => { %>
<%= renderFileSummary(fileSummary) %>
<% }) %>
<% } %>

<!-- Unchanged files -->
<% if (unchanged.length){ %>
<details>
<summary markdown="span">
All other files
</summary>

| File | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- |
<% unchanged.forEach((fileSummary) => { %>
<%= renderFileSummary(fileSummary) %>
<% }) %>
</details>
<% } %>