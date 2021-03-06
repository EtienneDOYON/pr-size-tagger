/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

module.exports = (app) => {

  //#region JSON SETTINGS
  let settings = require('./settings.json');

  const COMMENTS_ENABLED = settings.comments_enabled;

  const WEIGHT_OF_ADDITION = settings.weights.line_addition_weight;
  const WEIGHT_OF_DELETION = settings.weights.line_deletion_weight;
  const WEIGHT_OF_FILE = settings.weights.file_edited_weight;
  
  const S_BREAKPOINT = settings.sizeBreakpoints.small_size;
  const M_BREAKPOINT = settings.sizeBreakpoints.medium_size;
  const L_BREAKPOINT = settings.sizeBreakpoints.large_size;
  const XL_BREAKPOINT = settings.sizeBreakpoints.extra_large_size;
  
  //#endregion

  app.on("pull_request", async (context) => {

    const payload = context.payload;
    const pull_request = payload.pull_request;

    switch(payload.action) {
      case ("assigned"):
      case ("opened"):
      case ("ready_for_review"):
      case ("reopened"):
      case ("edited"):
      case ("synchronize"):    
        // If the PR is still a draft, we do not want to add a tag yet
        if (pull_request.draft == true) break;

        const [totalSize, sizeTag] = getTotalPrSize(pull_request.deletions, pull_request.additions, pull_request.changed_files);
        const currentLabel = pull_request.labels.find(label => (label.name == "XS" || label.name == "S" || label.name == "M"|| label.name == "L" || label.name == "XL")
                                  && label.name != sizeTag);

        // If the PR currently has a size tag, and it is different from the one we want, then we remove it first.
        if (currentLabel != null) {
            context.octokit.rest.issues.removeLabel(context.issue({name: currentLabel.name}))
          }

        // If comments are enabled, we tell the user what are we doing, and why
        if (COMMENTS_ENABLED) {
          var _body = "The total value of your PR is " + totalSize + ".\n"
            + "Therefore, this PR is considered " + sizeTag;

          context.octokit.rest.issues.createComment(context.issue({body: _body}))
        }

        // If the tag we need isn't on the PR yet, then we add it.
        if (pull_request.labels.find(label => label.name == sizeTag) == null)
          context.octokit.rest.issues.addLabels(context.issue({labels: [sizeTag]}))
        break;
    }


  });

  function getTotalPrSize(deletions, additions, changed_files) {
    const size = additions * WEIGHT_OF_ADDITION
      + deletions * WEIGHT_OF_DELETION
      + changed_files * WEIGHT_OF_FILE;

    var sizeTag = "";
    if (size <= S_BREAKPOINT) sizeTag = "XS";
    if (size > S_BREAKPOINT) sizeTag = "S";
    if (size > M_BREAKPOINT) sizeTag = "M";
    if (size > L_BREAKPOINT) sizeTag = "L";
    if (size > XL_BREAKPOINT) sizeTag = "XL";
    return [size, sizeTag];
  }
};
