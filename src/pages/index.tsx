/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/button-has-type */
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page } = postsPagination;
  const [pages, setPages] = useState(next_page);

  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });
  const [posts, setPosts] = useState(formattedPost);

  async function handleNextPage() {
    const resultPage = await fetch(`${pages}`).then(result => result.json());

    const newPost = resultPage.results.map((post: Post) => {
      return {
        uid: post.uid,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
        ),
      };
    });

    setPages(resultPage.next_page);
    setPosts(prevState => [...prevState, ...newPost]);
  }

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <Header />
      <main>
        <section className={commonStyles.container}>
          <ul>
            {posts.map(item => (
              <li className={styles.list} key={item.uid}>
                <Link href={`/post/${item.uid}`}>
                  <h1 className={styles.title}>{item.data.title}</h1>
                </Link>
                <p className={styles.text}>{item.data.subtitle}</p>
                <div className={styles.infoContainer}>
                  <span>
                    <FiCalendar size="20" />
                    <time>{item.first_publication_date}</time>
                  </span>
                  <span>
                    <FiUser size="20" />
                    <p>{item.data.author}</p>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {pages && (
            <button type="button" onClick={handleNextPage}>
              Carregar mais posts
            </button>
          )}
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'content')],
    {
      fetch: ['content'],
      pageSize: 1,
    }
  );

  const { next_page } = postsResponse;

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        results,
        next_page,
      },
    },
  };
};
