import React from "react";
import Head from "next/head";

function Compiler() {
  return (
    <>
      <Head>
        <title>Compiler - The Coding Camp</title>
      </Head>
      <div 
        style={{ 
          width: "100%", 
          height: "85vh", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          padding: "20px"
        }}
      >
        <h1 style={{ 
          fontSize: "2rem", 
          fontWeight: "bold", 
          marginBottom: "20px", 
          color: "#1c1917",
          fontFamily: "'Lexend', sans-serif"
        }}>
          Code Practice
        </h1>
        <iframe
          src="https://www.programiz.com/html/online-compiler/"
          width="80%"
          height="100%"
          style={{
            border: "2px solid #1c1917",
            borderRadius: "8px",
            boxShadow: "6px 6px 0px 0px rgba(28,25,23,1)"
          }}
          title="Online Compiler"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </>
  );
}

export default Compiler;
