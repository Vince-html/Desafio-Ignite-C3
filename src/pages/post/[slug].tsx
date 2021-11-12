/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable react/no-danger */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    next_post?: {
      uid: string;
      title: string;
    };
    prev_post?: {
      uid: string;
      title: string;
    };
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

interface PostProps {
  post: Post;
}

export default function Post({ post, preview }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    const textBody = RichText.asText(contentItem.body);
    const split = textBody.split(' ');
    const number_words = split.length;

    const result = Math.ceil(number_words / 200);
    return total + result;
  }, 0);

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const postWithDateFormatedAndReadingTime = {
    ...post,
    first_publication_date: format(
      new Date(post.first_publication_date),
      "dd MMM' 'yyyy",
      {
        locale: ptBR,
      }
    ),
    last_publication_date: format(
      new Date(post.last_publication_date),
      "dd MMM' 'yyyy, 'às' HH:mm",
      {
        locale: ptBR,
      }
    ),
    data: {
      ...post.data,
      average_reading_time: totalWords,
    },
  };

  const { data, first_publication_date, last_publication_date } =
    postWithDateFormatedAndReadingTime;
  const {
    author,
    banner,
    content,
    title,
    next_post,
    prev_post,
    average_reading_time,
  } = data;

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <Header />
      <main>
        <img src={post.data.banner.url} alt="" />
        <section className={(styles.container, commonStyles.container)}>
          <div>
            <h1 className={styles.title}>{post.data.title}</h1>
            <div className={styles.infoContainer}>
              <span>
                <FiCalendar size="20" />
                <time>{first_publication_date}</time>
              </span>
              <span>
                <FiUser size="20" />
                <p>{post.data.author}</p>
              </span>
              <span>
                <FiClock />
                <p> {`${average_reading_time} min`}</p>
              </span>
              {last_publication_date && (
                <div className={styles.edit}>
                  <span> * editado em {last_publication_date}</span>
                </div>
              )}
            </div>
            {post.data.content.map(item => {
              return (
                <article key={item.heading} className={styles.bodyContent}>
                  <h2
                    dangerouslySetInnerHTML={{
                      __html: item.heading,
                    }}
                  />
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(item.body),
                    }}
                  />
                </article>
              );
            })}
          </div>
        </section>
        <footer className={styles.footer}>
          {prev_post.uid ? (
            <Link href={`/post/${prev_post.uid}`}>
              <div className={styles.previous}>
                <span>{prev_post.title}</span>
                <a>Post anterior</a>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next_post.uid ? (
            <Link href={`/post/${next_post.uid}`}>
              <div className={styles.next}>
                <span>{next_post.title}</span>
                <a>Próximo post</a>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </footer>
        <Comments />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'content')],
    {
      pageSize: 10,
      fetch: ['post.uid'],
    }
  );

  const slugsArray = postsResponse.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths: slugsArray,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('content', String(slug), {});

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const nextPost = await prismic.query(
    [
      Prismic.Predicates.at('document.type', 'content'),
      Prismic.Predicates.dateAfter(
        'document.first_publication_date',
        response.first_publication_date
      ),
    ],
    {
      fetch: ['post.results.uid', 'post.results.title'],
      pageSize: 60,
      ref: previewData?.ref ?? null,
    }
  );

  const prevPost = await prismic.query(
    [
      Prismic.Predicates.at('document.type', 'content'),
      Prismic.Predicates.dateBefore(
        'document.first_publication_date',
        response.first_publication_date
      ),
    ],
    {
      pageSize: 60,
      fetch: ['post.results.uid', 'post.results.title'],
      ref: previewData?.ref ?? null,
    }
  );

  const index_next_post = nextPost.results.length - 1;
  const index_prev_post = prevPost.results.length - 1;
  const next_post = Boolean(nextPost.results[index_next_post]);
  const prev_post = Boolean(prevPost.results[index_prev_post]);

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      next_post: {
        uid: next_post ? nextPost.results[index_next_post].uid : null,
        title: next_post ? nextPost.results[index_next_post].data.title : null,
      },
      prev_post: {
        uid: prev_post ? prevPost.results[index_prev_post].uid : null,
        title: prev_post ? prevPost.results[index_prev_post].data.title : null,
      },
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      preview,
    },
    revalidate: 3600,
  };
};
