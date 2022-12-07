<%= prIdentifier %>

## <%= title %>

<% if (failed) { %>
:x: **Failed**
{failureMessage}

<% } else { %>
:white_check_mark: **Passed**
<% } %>
Commit: [<%= commitSha.substring(0, 7) %>](<%= commitUrl %>)

<% if(customMessage) { %>
<%= customMessage %>
<% } %>

<!-- All files, if diffs aren't present -->

<% if (!hasDiffs && all.length){ %>

<details>
<summary markdown="span">
All files
</summary>

| Name | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- | 
<%= renderFileSummary(total) %><%
all.forEach((fileSummary) => { print(renderFileSummary(fileSummary))
}) %>

</details>
<% } %>

<!-- Changed files -->

<% if (changed.length){ %>

| Name | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- | 
<%= renderFileSummary(total) %><%
changed.forEach((fileSummary) => { print(renderFileSummary(fileSummary))
}) %>
<% } %>

<!-- Unchanged files -->

<% if (unchanged.length){ %>

<details>
<summary markdown="span">
All other files
</summary>

| Name | Stmts | Branch | Funcs | Lines |
| ---- | ----- | ------ | ----- | ----- |<%
unchanged.forEach((fileSummary) => { print(renderFileSummary(fileSummary))
}) %>

</details>
<% } %>
