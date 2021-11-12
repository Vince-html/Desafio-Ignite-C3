/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// import { useUtterances } from '../../hooks/useUtterances';

import { useUtterances } from '../../hooks/useUtterances';

const commentNodeId = 'comments';

const Comments = () => {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
};

export default Comments;
