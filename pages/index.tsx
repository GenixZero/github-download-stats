import { GetServerSidePropsContext, NextPage } from "next";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    redirect: {
      destination: 'https://github.com/genixzero/github-download-stats',
      permanent: false,
    },
  }
};

const Home: NextPage = () => {
  return (
    <h1>You shouldn&apos;t be seeing this</h1>
  )
}

export default Home
