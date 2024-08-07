--
-- PostgreSQL database paymentgateway
--
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: paymentrequests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paymentrequests (
    referenceid character varying(256) NOT NULL,
    sender character varying(50) NOT NULL,
    recipient character varying(50) NOT NULL,
    amount numeric(36,18) NOT NULL,
    created_on timestamp without time zone NOT NULL,
    originaddress character varying(64) DEFAULT ''::character varying NOT NULL,
    token character varying(10) DEFAULT ''::character varying NOT NULL,
    chainid integer DEFAULT 1 NOT NULL,
    blockhash character varying(66),
    settled_on date
);


ALTER TABLE public.paymentrequests OWNER TO postgres;

--
-- Name: paymentsreceived; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paymentsreceived (
    referenceid character varying(256) NOT NULL,
    sender character varying(50),
    recipient character varying(50),
    amount numeric(36,18) NOT NULL,
    fees numeric(36,18) NOT NULL,
    created_on timestamp without time zone NOT NULL,
    selleraddress character varying(64) DEFAULT ''::character varying NOT NULL,
    token character varying(10) DEFAULT ''::character varying NOT NULL,
    chainid integer DEFAULT 1 NOT NULL,
    paymentid character varying(256) NOT NULL,
    blockhash character varying(256) NOT NULL,
    settled_on timestamp without time zone,
    settled_amount numeric(36,18),
    settled_chainid integer DEFAULT 1,
    settled_paymentid character varying(256),
    minvalidation integer DEFAULT 1,
    nrvalidation integer DEFAULT 0,
    txhash character varying(128) DEFAULT ''::character varying
);


ALTER TABLE public.paymentsreceived OWNER TO postgres;

--
-- Name: striperequests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.striperequests (
    stripeid character varying(128) NOT NULL,
    referenceid character varying(256) NOT NULL,
    amount numeric(9,2) NOT NULL,
    created_on timestamp without time zone NOT NULL,
    status character varying(16) NOT NULL,
    statusmessage character varying(64),
    reason character varying(128)
);


ALTER TABLE public.striperequests OWNER TO postgres;

--
-- Name: validationsqueue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.validationsqueue (
    validatoraddress character varying(64) NOT NULL,
    buyorderid integer NOT NULL,
    txhash character varying(128) NOT NULL,
    chainid integer NOT NULL
);


ALTER TABLE public.validationsqueue OWNER TO postgres;

--
-- Data for Name: paymentrequests; Type: TABLE DATA; Schema: public; Owner: postgres
--





--
-- Name: paymentrequests paymentrequests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paymentrequests
    ADD CONSTRAINT paymentrequests_pkey PRIMARY KEY (referenceid);


--
-- Name: striperequests striperequests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.striperequests
    ADD CONSTRAINT striperequests_pkey PRIMARY KEY (stripeid);


--
-- Name: validationsqueue validationsqueue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.validationsqueue
    ADD CONSTRAINT validationsqueue_pkey PRIMARY KEY (buyorderid);


--
-- Name: TABLE paymentrequests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.paymentrequests TO paymentgateway;


--
-- Name: TABLE paymentsreceived; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.paymentsreceived TO paymentgateway;


--
-- Name: TABLE striperequests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.striperequests TO paymentgateway;


--
-- Name: TABLE validationsqueue; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.validationsqueue TO paymentgateway;


