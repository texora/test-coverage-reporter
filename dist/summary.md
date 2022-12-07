<%= prIdentifier %>

## <%= title %>

<% if (failed) { %>
:white_check_mark: **Passed**
<% } else { %>
:x: **Failed**
{failureMessage}

<% } %>
Commit: [<%= commitSha.substring(0, 7) %>](commitUrl)

<% if(customMessage) { %>
<%= customMessage %>
<% } %>

<!-- Totals -->

| Total | <%= total.percent %>% |
| :---------------- | --------------------: | <%
if (!hasDiffs){ %>| Change from base: | <%= total.diff %>% |
<% } %>| Total Lines: | <%= total.lines %> |

<!-- All files, if diffs aren't present -->

<% if (!hasDiffs && all.length){ %>

<details>
<summary markdown="span">
All files
</summary>

| File | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- | <%=
renderFileSummary(total) %><%
all.forEach((fileSummary) => { print(renderFileSummary(fileSummary))
}) %>

</details>
<% } %>

<!-- Changed files -->

<% if (changed.length){ %>

| File | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- | <%=
renderFileSummary(total) %><%
changed.forEach((fileSummary) => { renderFileSummary(fileSummary)
}) %>
<% } %>

<!-- Unchanged files -->

<% if (unchanged.length){ %>

<details>
<summary markdown="span">
All other files
</summary>

| File | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- |<%
unchanged.forEach((fileSummary) => { renderFileSummary(fileSummary)
}) %>

</details>
<% } %>
