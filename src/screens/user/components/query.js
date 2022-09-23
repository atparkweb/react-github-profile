import {useContext, useEffect, useReducer, useRef} from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import * as GitHub from '../../../github-client';

function useSetState(initialState) {
  const [state, setState] = useReducer(
    (state, newState) => ({...state, ...newState}),
    initialState,
  );

  return [state, setState];
}

function useSafeSetState(initialState) {
  const [state, setState] = useSetState(initialState);

  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;

    // Clean-up on unmount
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = (...args) => {
    if (mountedRef.current) {
      setState(...args);
    }
  };

  return [state, safeSetState];
}

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

function useQuery({query, variables, normalize = data => data,}) {
  const client = useContext(GitHub.Context);

  const [state, safeSetState] = useSafeSetState(
    {
      loaded: false,
      fetching: false,
      data: null,
      error: null
    }
  );

  useEffect(() => {
    if (isEqual(previousInputs, [query, variables])) {
      return;
    }

    safeSetState({fetching: true});

    client
      .request(query, variables)
      .then(res =>
        safeSetState({
          data: normalize(res),
          error: null,
          loaded: true,
          fetching: false,
        }),
      )
      .catch(error =>
        safeSetState({
          error,
          data: null,
          loaded: false,
          fetching: false,
        }),
      );
  });

  const previousInputs = usePrevious([query, variables]);

  return state;
}

const Query = ({children, ...props}) => children(useQuery(props));

Query.propTypes = {
  query: PropTypes.string.isRequired,
  variables: PropTypes.object,
  normalize: PropTypes.func,
};

export default Query;
export {useQuery};
