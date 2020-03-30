import React, { useCallback, useState } from 'react';
import styled from '@emotion/styled';
import { gql } from 'apollo-boost';
import { useLazyQuery, useMutation, useQuery } from '@apollo/react-hooks';
import { sample, sampleSize, startCase } from 'lodash';

const Main = styled.main`
  display: flex;
  height: 100%;
  padding: 3rem;
  max-width: 100%;
  flex-direction: column;
`;

const Header = styled.header`
  padding: 3rem;
  font-size: 2rem;
`;

const CardsContainer = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;

  margin: 1rem;
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;

  margin: 1rem;
`;

const Select = styled.select`
  margin: 0.5rem 1rem;
`;

const CardHeading = styled.h3`
  text-align: center;
`;

const CardImage = styled.img`
  cursor: pointer;
`;

const HAND = gql`
  query hand($name: String!) {
    agent(where: { name: $name }) {
      id
      name
      hand(orderBy: name_ASC) {
        id
        name
        image {
          id
          url
        }
      }
    }
  }
`;

const ALL_CARDS = gql`
  query allCards {
    cards(orderBy: name_ASC) {
      id
      name
      isDrawn
      image {
        id
        fileName
        url
      }
    }
  }
`;

const AGENTS = gql`
  query getAgents {
    agents {
      id
      name
      hand {
        id
        name
        image {
          id
          url
        }
      }
    }
  }
`;

const UPDATE_AGENT_HAND = gql`
  mutation updateAgent($agentName: String!, $cardNamesInput: [CardWhereUniqueInput!]) {
    updateAgent(where: { name: $agentName }, data: { hand: { set: $cardNamesInput } }) {
      id
      name
      hand {
        id
        name
        image {
          id
          url
        }
      }
    }
    publishAgent(where: { name: $agentName }) {
      id
      stage
    }
  }
`;

const UPDATE_CARD_STATUS = gql`
  mutation updateCard($cardName: String!, $isDrawn: Boolean!) {
    updateCard(where: { name: $cardName }, data: { isDrawn: $isDrawn }) {
      id
      name
    }
    publishCard(where: { name: $cardName }) {
      id
      stage
    }
  }
`;

const CHANGE_OWNER = gql`
  mutation changeOwner($agentName: String!, $cardName: String!) {
    updateAgent(where: { name: $agentName }, data: { hand: { disconnect: [{ name: $cardName }] } }) {
      id
      name
      hand {
        id
        name
        image {
          id
        }
      }
    }
    publishAgent(where: { name: $agentName }) {
      id
      stage
    }
    updateCard(where: { name: $cardName }, data: { agent: { connect: { name: "JVB" } } }) {
      id
      name
    }
    publishCard(where: { name: $cardName }) {
      id
      stage
    }
  }
`;

const RELEASE_CARD = gql`
  mutation releaseCard($cardName: String!) {
    updateAgent(where: { name: "JVB" }, data: { hand: { disconnect: [{ name: $cardName }] } }) {
      id
      name
      hand {
        id
        name
        image {
          id
        }
      }
    }
    publishAgent(where: { name: "JVB" }) {
      id
      stage
    }
    updateCard(where: { name: $cardName }, data: { isDrawn: false }) {
      id
      name
      isDrawn
    }
    publishCard(where: { name: $cardName }) {
      id
      stage
    }
  }
`;

const filterDrawn = ({ isDrawn }: any) => !isDrawn;

export const App = () => {
  const [selectedAgent, setAgent] = useState('');
  const [gettingHand, setGettingHand] = useState(false);
  const [stage, setStage] = useState('');
  const { loading: allCardsLoading, error: allCardsError, data: allCardsData } = useQuery(ALL_CARDS);
  const { loading: agentLoading, error: agentError, data: agentData } = useQuery(AGENTS);
  const [getCards, { loading: cardLoading, error: cardError, data: cardData }] = useLazyQuery(HAND);
  const [updateAgentHand, { loading: updateAgentHandLoading, error: updateAgentHandError }] = useMutation(
    UPDATE_AGENT_HAND
  );
  const [updateCard, { loading: updateCardLoading, error: updateCardError }] = useMutation(UPDATE_CARD_STATUS);
  const [changeOwner] = useMutation(CHANGE_OWNER);
  const [releaseCard] = useMutation(RELEASE_CARD);

  const Agents = agentData
    ? agentData.agents.map(({ name }: any) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))
    : null;

  const doStuff = () => {
    const nothingErrored = !(allCardsError || agentError || cardError || updateAgentHandError || updateCardError);
    const nothingLoading = !(
      agentLoading ||
      cardLoading ||
      allCardsLoading ||
      updateAgentHandLoading ||
      updateCardLoading
    );
    if (nothingErrored && nothingLoading) {
      console.log(cardData);
      const hasHand = cardData && cardData.agent.hand.length > 0;
      const hasAgent = selectedAgent !== '';
      if (stage === '1' && !hasHand && allCardsData && hasAgent && !gettingHand) {
        const cards = allCardsData.cards.filter(filterDrawn);
        const majorArcana = cards.filter(({ name }: any) => isNaN(Number(name[0])));
        const otherCards = cards.filter(({ name }: any) => !isNaN(Number(name[0])));
        const major = sample(majorArcana);
        const otherMajors = majorArcana.filter(({ name }: any) => name !== major.name);
        const restOfHand = sampleSize([...otherMajors, ...otherCards], 4);
        const hand = [major, ...restOfHand];
        const cardNames = hand.map(({ name }: any) => name);
        const cardNamesInput = hand.map(({ name }: any) => ({ name }));
        setGettingHand(true);
        updateAgentHand({
          variables: { agentName: selectedAgent, cardNamesInput },
          refetchQueries: [{ query: HAND, variables: { name: selectedAgent } }],
        });
        cardNames.forEach((name) => {
          updateCard({ variables: { cardName: name, isDrawn: true } });
        });
      }
      if (stage !== '' && stage !== '1' && !hasHand && allCardsData && hasAgent) {
        const cards = allCardsData.cards.filter(filterDrawn);
        const hand = sampleSize(cards, 5);
        const cardNames = hand.map(({ name }: any) => name);
        const cardNamesInput = hand.map(({ name }: any) => ({ name }));
        updateAgentHand({
          variables: { agentName: selectedAgent, cardNamesInput },
          refetchQueries: [{ query: HAND, variables: { name: selectedAgent } }],
        });
        cardNames.forEach((name) => {
          updateCard({ variables: { cardName: name, isDrawn: true } });
        });
      }
    } else {
      if (!nothingErrored) {
        console.error(allCardsError, agentError, cardError, updateAgentHandError, updateCardError);
      }
    }
  };
  doStuff();

  const changeOwnerHandler = useCallback(
    (cardName) => () => {
      if (selectedAgent !== 'JVB') {
        changeOwner({
          variables: { agentName: selectedAgent, cardName },
          refetchQueries: [{ query: HAND, variables: { name: selectedAgent } }],
        });
      } else {
        releaseCard({ variables: { cardName }, refetchQueries: [{ query: HAND, variables: { name: selectedAgent } }] });
      }
    },
    [selectedAgent, changeOwner]
  );

  const Cards = cardData
    ? cardData.agent.hand.map(({ name, image: { url } }: any) => (
        <CardContainer key={name}>
          <CardHeading>{startCase(name).replace('Of', 'of')}</CardHeading>
          <CardImage src={url} alt={name} onClick={changeOwnerHandler(name)} />
        </CardContainer>
      ))
    : null;

  const handleAgent = useCallback(
    (e) => {
      const name = e.target.value;
      if (name === '') return;
      setAgent(name);
      getCards({ variables: { name } });
    },
    [setAgent, getCards]
  );

  const handleStage = useCallback(
    (e) => {
      const selectedStage = e.target.value;
      if (selectedStage === '') return;
      setStage(selectedStage);
    },
    [setStage]
  );

  const resetIsDrawn = useCallback(() => {
    console.log('click');
    allCardsData.cards.forEach(({ name, isDrawn }: any) => {
      console.log(isDrawn);
      if (isDrawn) {
        updateCard({ variables: { cardName: name, isDrawn: false } });
      }
    });
  }, [updateCard, allCardsData]);

  return (
    <>
      <Header>
        <h1>Kult Cards</h1>
      </Header>
      <Main>
        <div>
          <Select value={selectedAgent} onChange={handleAgent}>
            <option value="">Who are you?</option>
            {Agents}
          </Select>
          <Select value={stage} onChange={handleStage}>
            <option value="">What stage are you on?</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
          </Select>
          {selectedAgent === 'JVB' ? <button onClick={resetIsDrawn}>Reset isDrawn</button> : null}
        </div>
        <CardsContainer>{Cards}</CardsContainer>
      </Main>
    </>
  );
};
