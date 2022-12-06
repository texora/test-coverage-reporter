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
| Change from base: |    <%= total.diff %>% |
| Total Lines:      |    <%= total.lines %> |

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
<% if (changed.length){ %>
<details>
<summary markdown="span">
### All other files
</summary>

| File | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- |

<% unchanged.forEach((fileSummary) => { %>
<%= renderFileSummary(fileSummary) %>
<% }) %>
</details>
<% } %>