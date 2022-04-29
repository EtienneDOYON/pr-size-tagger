/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 * @param {import('./settings.json')} settings
 */

module.exports = (app, settings) => {

  //#region JSON SETTINGS
  const COMMENTS_ENABLED = settings.comments_enabled;
/*
  const WEIGHT_OF_ADDITION = settings.weights.line_addition_weight;
  const WEIGHT_OF_DELETION = settings.weights.line_deletion_weight;
  const WEIGHT_OF_FILE = settings.weights.file_edited_weight;
  
  const S_BREAKPOINT = settings.sizeBreakpoints.small_size;
  const M_BREAKPOINT = settings.sizeBreakpoints.medium_size;
  const L_BREAKPOINT = settings.sizeBreakpoints.large_size;
  const XL_BREAKPOINT = settings.sizeBreakpoints.extra_large_size;
  */
  //#endregion

  const WEIGHT_OF_ADDITION = 0;
  const WEIGHT_OF_DELETION = 0;
  const WEIGHT_OF_FILE = 0;
  
  const S_BREAKPOINT = 0;
  const M_BREAKPOINT = 0;
  const L_BREAKPOINT = 0;
  const XL_BREAKPOINT = 0;


  app.on("pull_request", async (context) => {

    const payload = context.payload;
    const pull_request = payload.pull_request;

    console.log("New pull request action detected: " + payload.action);

    switch(payload.action) {

      case ("assigned"):
      case ("opened"):
      case ("reopened"):
      case ("ready_for_review"):
      case ("edited"):
      case ("synchronize"):
        const sizeTag = getTotalPrSize(pull_request.deletions, pull_request.additions, pull_request.changed_files);

        if (COMMENTS_ENABLED) {
          var _body = "The total value of your PR is " + totalSize + ".\n"
            + "Therefore, this PR is considered " + sizeTag;

          context.octokit.rest.issues.createComment(context.issue({body: _body}))
        }
        context.octokit.rest.issues.addLabels(context.issue({labels: [sizeTag]}))
        break;

      default:
        return;
    }


  });

  function getTotalPrSize(deletions, additions, changed_files) {
    console.log("deletions: " + deletions);
    console.log("additions: " + additions);
    console.log("changed_files: " + changed_files);

    const size = additions * WEIGHT_OF_ADDITION
      + deletions * WEIGHT_OF_DELETION
      + changed_files * WEIGHT_OF_FILE;

    var sizeTag = "";
    if (size <= S_BREAKPOINT) sizeTag = "XS";
    if (size > S_BREAKPOINT) sizeTag = "S";
    if (size > M_BREAKPOINT) sizeTag = "M";
    if (size > L_BREAKPOINT) sizeTag = "L";
    if (size > XL_BREAKPOINT) sizeTag = "XL";
    return sizeTag;
  }
  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
